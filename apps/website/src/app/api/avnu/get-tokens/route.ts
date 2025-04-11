import {fetchTokens} from '@avnu/avnu-sdk';
import {NextResponse, NextRequest} from 'next/server';

import {ErrorCode} from '@/utils/errors';
import {HTTPStatus} from '@/utils/http';

export async function GET(request: NextRequest) {
  try {
    const tokens = await fetchTokens({});
    console.log('tokens');
    return NextResponse.json({data: tokens}, {status: HTTPStatus.OK});
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {code: ErrorCode.TRANSACTION_ERROR, error},
      {status: HTTPStatus.InternalServerError},
    );
  }
}
