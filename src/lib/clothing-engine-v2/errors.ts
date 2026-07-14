/**
 * Motor 2.0 — typede feil.
 * Koder per engine-2-plan Task 1; adferd per design-spec §17 (feil og fallback).
 */

export type EngineV2ErrorCode =
  | 'invalid_number'
  | 'unsupported_age'
  | 'invalid_situation_for_age'
  | 'invalid_material_preference'
  | 'unresolved_material_constraint';

export class EngineV2Error extends Error {
  readonly code: EngineV2ErrorCode;

  constructor(code: EngineV2ErrorCode, message: string) {
    super(message);
    this.name = 'EngineV2Error';
    this.code = code;
  }
}
