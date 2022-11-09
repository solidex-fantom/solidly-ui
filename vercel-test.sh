#!/bin/bash

if [[ "$VERCEL_GIT_COMMIT_REF" == "stg" ]] ; then
  echo ">> Proceeding with deploy."
  exit 1; 
else
  echo ">> Skipping deploy!"
  exit 0;
fi