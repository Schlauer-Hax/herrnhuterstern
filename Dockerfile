FROM denoland/deno:1.24.0

WORKDIR /app

EXPOSE 8000

COPY . .

RUN deno cache index.ts

CMD ["run", "-A", "index.ts"]