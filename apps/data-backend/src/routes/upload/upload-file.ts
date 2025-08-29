import type { FastifyInstance } from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import dotenv from 'dotenv';
import { pinata } from '../../services/pinata'; // Ensure this path is correct
dotenv.config();

async function uploadFile(fastify: FastifyInstance) {
  // Check if the plugin is already registered
  if (!fastify.hasContentTypeParser('multipart/form-data')) {
    fastify.register(fastifyMultipart);
  }

  fastify.post('/file', async (request, reply) => {
    try {
      const data = await request.file();
      const fileBuffer = await data?.toBuffer();
      const fileName = data?.filename ?? '';
      const fileType = data?.mimetype ?? data?.type ?? "jpg"

      console.log("fileBuffer", fileBuffer);
      console.log("fileName", fileName);
      console.log("fileType", fileType);
      
      if( !fileBuffer ) {
        return reply.code(400).send({ message: 'No file uploaded' });
      }

      const { IpfsHash } = await pinata.pinFileToIPFS(fileBuffer, {
        pinataMetadata: {
          name: fileName,
          type: fileType,
        },
      });

      console.log("IpfsHash", IpfsHash);

      const gatewayUrl = process.env.IPFS_GATEWAY || 'https://ipfs.io';

      console.log("gatewayUrl", gatewayUrl);

      const url = `${gatewayUrl}/ipfs/${IpfsHash}`;

      console.log("url", url);

      return reply.code(200).send({
        hash: IpfsHash,
        url: url,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  fastify.post('/file/metadata', {
    schema: {
      body: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          twitter: { type: 'string' },
          github: { type: 'string' },
          telegram: { type: 'string' },
          website: { type: 'string' },
          description: { type: 'string' },
          nostr_event_id: { type: 'string' },
          token_address: { type: 'string' },
          creator_fee_destination: { type: 'string' },
          ipfs_hash: { type: 'string' }
        }
      }
    },
    preHandler: async (request, reply) => {
      // Add CORS headers
      reply.header('Access-Control-Allow-Origin', '*');
      reply.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
      reply.header('Access-Control-Allow-Headers', 'Content-Type');
    }
  }, async (request, reply) => {
    try {
      console.log("request body", request?.body);
      
      const jsonContent = request.body as Record<string, unknown>;
      
      console.log("jsonContent", jsonContent);
      if (!jsonContent) {
        return reply.code(400).send({ message: 'No JSON data provided' });
      }

      // Pin JSON to IPFS with metadata
      const { IpfsHash } = await pinata.pinFileToIPFS(Buffer.from(JSON.stringify(jsonContent)), {
        pinataMetadata: {
          name: 'metadata.json',
          type: 'application/json'
        }
      });

      const gatewayUrl = process.env.IPFS_GATEWAY || 'https://ipfs.io';

      return reply.code(200).send({
        hash: IpfsHash,
        url: `${gatewayUrl}/ipfs/${IpfsHash}`,
        metadata: {
          name: 'metadata.json',
          type: 'application/json',
          timestamp: Date.now()
        }
      });
    } catch (error) {
      fastify.log.error("Error METADATA JSON");
      return reply.code(500).send({ 
        message: 'Internal Server Error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

export default uploadFile;
