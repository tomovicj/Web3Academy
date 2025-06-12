## How to run

### Manual
 
 1. Install npm modules
```bash
npm install
```

2. Compile contracts
```bash
npx hardhat compile
```

3. Start local hardhat node
```bash
npx hardhat node
```

4. Run deployment script. (Factory and 3 mock tokens)
> [!IMPORTANT] 
> Make sure the hardhat network from previous step is still running.

> [!IMPORTANT] 
> Copy addresses of deployed contracts to frontend's `.env` file.

```bash
npx hardhat ignition deploy ./ignition/modules/EzSwapDev.ts --network localhost
```

### Docker
1. Build an image
```bash
docker build -t ezswap-hardhat .
```

2. Run the container
```bash
docker run -it -p 8545:8545 ezswap-hardhat
```

3. Run deployment script. (Factory and 3 mock tokens)
> [!IMPORTANT] 
> Copy addresses of deployed contracts to frontend's `.env` file.
> Do this before building a frontend image

```bash
sudo docker run --network host -it ezswap-hardhat npx hardhat ignition deploy ./ignition/modules/EzSwapDev.ts --network localhost
```
