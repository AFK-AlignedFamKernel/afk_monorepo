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
      const fileType = data?.mimetype ?? "jpg"

      if( !fileBuffer ) {
        return reply.code(400).send({ message: 'No file uploaded' });
      }

      const { IpfsHash } = await pinata.pinFileToIPFS(fileBuffer, {
        pinataMetadata: {
          name: fileName,
          type: fileType,
        },
      });

      const gatewayUrl = process.env.IPFS_GATEWAY || 'https://ipfs.io';

      return reply.code(200).send({
        hash: IpfsHash,
        url: `${gatewayUrl}/ipfs/${IpfsHash}`,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  fastify.post('/file/metadata', async (request, reply) => {
    try {

      console.log("request body",request?.body)
      
      const jsonContent = request.body as Record<string, unknown>;
      
      console.log("jsonContent",jsonContent)
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
