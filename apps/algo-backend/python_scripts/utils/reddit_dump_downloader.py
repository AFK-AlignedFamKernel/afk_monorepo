import os
import logging
import requests
import bz2
import json
from datetime import datetime
from typing import Dict, List, Optional
import pandas as pd
from tqdm import tqdm
from sqlalchemy.orm import Session
from models import ContentCreator, CreatorContent

logger = logging.getLogger(__name__)

class RedditDumpDownloader:
    def __init__(self, db: Session, download_dir: str = "reddit_dumps"):
        self.db = db
        self.download_dir = download_dir
        self.supported_dump_types = ['submissions', 'comments']
        
        # Create download directory if it doesn't exist
        if not os.path.exists(download_dir):
            os.makedirs(download_dir)

    def download_pushshift_dump(self, year: int, month: int, dump_type: str) -> str:
        """
        Download Reddit data dump from Pushshift.io
        
        Args:
            year: Year of the dump
            month: Month of the dump
            dump_type: Type of dump ('submissions' or 'comments')
            
        Returns:
            Path to downloaded file
        """
        if dump_type not in self.supported_dump_types:
            raise ValueError(f"Unsupported dump type. Must be one of {self.supported_dump_types}")

        # Format filename
        filename = f"RS_{year}_{month:02d}.bz2" if dump_type == 'submissions' else f"RC_{year}_{month:02d}.bz2"
        filepath = os.path.join(self.download_dir, filename)

        # Check if file already exists
        if os.path.exists(filepath):
            logger.info(f"File {filename} already exists, skipping download")
            return filepath

        # Construct URL
        base_url = "https://files.pushshift.io/reddit"
        url = f"{base_url}/{dump_type}/{filename}"

        try:
            # Download with progress bar
            response = requests.get(url, stream=True)
            response.raise_for_status()
            
            total_size = int(response.headers.get('content-length', 0))
            block_size = 1024  # 1 Kibibyte

            with open(filepath, 'wb') as f, tqdm(
                desc=filename,
                total=total_size,
                unit='iB',
                unit_scale=True,
                unit_divisor=1024,
            ) as pbar:
                for data in response.iter_content(block_size):
                    size = f.write(data)
                    pbar.update(size)

            logger.info(f"Successfully downloaded {filename}")
            return filepath

        except Exception as e:
            logger.error(f"Error downloading {filename}: {str(e)}")
            if os.path.exists(filepath):
                os.remove(filepath)
            raise

    def download_multiple_dumps(self, start_year: int, end_year: int, dump_type: str) -> List[str]:
        """
        Download multiple dumps for a date range
        
        Args:
            start_year: Start year
            end_year: End year
            dump_type: Type of dump ('submissions' or 'comments')
            
        Returns:
            List of downloaded file paths
        """
        downloaded_files = []
        
        for year in range(start_year, end_year + 1):
            for month in range(1, 13):
                try:
                    filepath = self.download_pushshift_dump(year, month, dump_type)
                    downloaded_files.append(filepath)
                except Exception as e:
                    logger.error(f"Failed to download dump for {year}-{month:02d}: {str(e)}")
                    continue
                
        return downloaded_files

    def process_dump_file(self, file_path: str) -> None:
        """
        Process a downloaded dump file
        
        Args:
            file_path: Path to the .bz2 dump file
        """
        try:
            with bz2.open(file_path, 'rt', encoding='utf-8') as f:
                for line in tqdm(f, desc="Processing entries"):
                    try:
                        data = json.loads(line)
                        self._process_entry(data)
                    except json.JSONDecodeError:
                        continue
                    except Exception as e:
                        logger.error(f"Error processing entry: {str(e)}")
                        continue

        except Exception as e:
            logger.error(f"Error processing file {file_path}: {str(e)}")
            raise

    def _process_entry(self, data: Dict) -> None:
        """Process a single Reddit entry (submission or comment)"""
        try:
            # Extract author info
            author = data.get('author')
            if not author or author == '[deleted]':
                return

            # Get or create creator
            creator = self._get_or_create_creator(author)
            if not creator:
                return

            # Determine if it's a submission or comment
            is_submission = 'title' in data

            # Create content entry
            content = CreatorContent(
                platform='reddit',
                platform_content_id=data['id'],
                title=data.get('title', '') if is_submission else '',
                content=data.get('selftext', '') if is_submission else data.get('body', ''),
                likes=data.get('score', 0),
                comments=data.get('num_comments', 0) if is_submission else 0,
                published_at=datetime.fromtimestamp(data.get('created_utc', 0)),
                content_metadata=data
            )
            self.db.add(content)
            self.db.commit()

        except Exception as e:
            logger.error(f"Error processing entry {data.get('id')}: {str(e)}")
            self.db.rollback()

    def _get_or_create_creator(self, username: str) -> Optional[ContentCreator]:
        """Get or create a Reddit creator"""
        try:
            creator = self.db.query(ContentCreator).filter_by(
                platform='reddit',
                platform_id=username
            ).first()

            if not creator:
                creator = ContentCreator(
                    platform='reddit',
                    platform_id=username,
                    name=username,
                    description='',
                    followers_count=0,
                    content_count=0,
                    total_likes=0,
                    total_comments=0,
                    is_verified=False,
                    creator_metadata={}
                )
                self.db.add(creator)
                self.db.commit()

            return creator

        except Exception as e:
            logger.error(f"Error getting/creating creator {username}: {str(e)}")
            return None

    def update_creator_stats(self) -> None:
        """Update creator statistics based on processed content"""
        try:
            creators = self.db.query(ContentCreator).filter_by(platform='reddit').all()
            
            for creator in tqdm(creators, desc="Updating creator stats"):
                # Get all content for this creator
                content = self.db.query(CreatorContent).filter_by(
                    platform='reddit',
                    creator_id=creator.id
                ).all()

                # Update stats
                creator.content_count = len(content)
                creator.total_likes = sum(c.likes for c in content)
                creator.total_comments = sum(c.comments for c in content)
                
                # Calculate engagement rate
                if creator.content_count > 0:
                    creator.engagement_rate = (creator.total_likes + creator.total_comments) / creator.content_count

            self.db.commit()

        except Exception as e:
            logger.error(f"Error updating creator stats: {str(e)}")
            self.db.rollback()

    def download_and_process(self, start_year: int, end_year: int, dump_type: str) -> None:
        """
        Download and process dumps for a date range
        
        Args:
            start_year: Start year
            end_year: End year
            dump_type: Type of dump ('submissions' or 'comments')
        """
        try:
            # Download dumps
            downloaded_files = self.download_multiple_dumps(start_year, end_year, dump_type)
            
            # Process each file
            for filepath in downloaded_files:
                logger.info(f"Processing file: {filepath}")
                self.process_dump_file(filepath)
            
            # Update creator stats
            self.update_creator_stats()
            
        except Exception as e:
            logger.error(f"Error in download and process: {str(e)}")
            raise 