#!/usr/bin/env bash

concurrently 'cd server && npm run dev' 'cd client && npm run start'