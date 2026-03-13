import { NextResponse } from 'next/server';
import { processQuoteIntake } from '@/lib/intake';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const result = await processQuoteIntake();

    return NextResponse.json({
      message: `Processed ${result.processed} emails, ${result.skipped} skipped`,
      ...result,
    });
  } catch (error) {
    console.error('Email intake failed:', error);
    return NextResponse.json(
      { error: 'Email intake failed', details: String(error) },
      { status: 500 }
    );
  }
}
