# EzSwap Frontend

## How to run

### Manual
 
 1. Install npm modules
```bash
npm install
```

2. Configure environment variables
- Rename `.env.example` to `.env`.
- Copy deployed contract addresses in `.env` file.

```text
VITE_NETWORK=
VITE_FACTORY_ADDRESS=
VITE_TOKEN1_ADDRESS=
VITE_TOKEN2_ADDRESS=
VITE_TOKEN3_ADDRESS=
```

3. Build
```bash
npm run build
```

4. Run frontend (default port = 3000)
```bash
npm run start
```

### Docker
1. Configure environment variables
- Rename `.env.example` to `.env`.
- Copy deployed contract addresses in `.env` file.

```text
VITE_NETWORK=
VITE_FACTORY_ADDRESS=
VITE_TOKEN1_ADDRESS=
VITE_TOKEN2_ADDRESS=
VITE_TOKEN3_ADDRESS=
```

2. Build an image
```bash
docker build -t ezswap-frontend .
```

3. Run the container
```bash
docker run -it -p 3000:80 ezswap-frontend
```
