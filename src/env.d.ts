/// <reference types="astro/client" />
// This file is used to define the types for the environment variables.
// Without this, the environment variables are not typed and will cause type errors.

interface ImportMetaEnv {
  readonly PUBLIC_PLACEKIT_API_KEY?: string;
}
