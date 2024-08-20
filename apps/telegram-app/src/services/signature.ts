import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

const verifySignature = (req: NextApiRequest, secret: string) => {
  const signature = req.headers['x-signature'] as string;
  const body = JSON.stringify(req.body);
  const hash = crypto.createHmac('sha256', secret).update(body).digest('hex');

  return signature === hash;
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const secret = process.env.WEBHOOK_SECRET || '';

    if (!verifySignature(req, secret)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Process webhook data
    const data = req.body;

    // Acknowledge receipt
    res.status(200).json({ status: 'success' });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};

export default handler;
