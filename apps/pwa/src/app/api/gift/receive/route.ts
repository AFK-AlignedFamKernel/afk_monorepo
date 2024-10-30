import {NextRequest, NextResponse} from 'next/server';

import {ErrorCode} from '@/utils/errors';
import {HTTPStatus} from '@/utils/http';

export async function POST(request: NextRequest) {
  try {
    /** TODO Payment receive */
    return NextResponse.json({message: 'lfg'}, {status: HTTPStatus.OK});
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {code: ErrorCode.TRANSACTION_ERROR, error},
      {status: HTTPStatus.InternalServerError},
    );
  }
}
