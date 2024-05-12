import { BrowserProvider, InterfaceAbi, ethers } from "ethers";
import { toast } from "react-toastify";

export interface ContractDetails {
  abi: InterfaceAbi;
  address?: string;
}

export interface ContractProps extends ContractDetails {
  abi: InterfaceAbi;
  bytecode: string;
  parameters: string[];
}

class BlockchainServices {
  constructor(private _networkID = "0x51") {}

  getProvider(network?: "") {
    if (window.ethereum === null && network) {
      toast.error("MetaMask is not installed! Running as READ-ONLY mode.");
      return;
    } else {
      return new ethers.BrowserProvider(window.ethereum);
    }
  }

  async isOnRightNetwork(wallet: BrowserProvider): Promise<boolean> {
    const currentNetworkID = await wallet.send("eth_chainId", []);
    if (currentNetworkID !== this._networkID) {
      toast.warning("Please switch to the right network!");
      return false;
    }
    return true;
  }

  async switchNetwork(wallet: BrowserProvider) {
    wallet
      .send("wallet_switchEthereumChain", [{ chainId: this._networkID }])
      .catch(async (Error) => {
        if (Error.code === 4902) {
          await wallet.send("wallet_addEthereumChain", [
            {
              chainId: this._networkID,
              rpcUrls: ["https://evm.shibuya.astar.network"],
              chainName: "Astar Shibuya",
              nativeCurrency: {
                name: "SBY",
                symbol: "SBY",
                decimals: 18,
              },
              blockExplorerUrls: ["https://shibuya.blockscout.com/"],
            },
          ]);
        }
      });
  }

  async performSignIn(wallet: BrowserProvider) {
    const currentSigner = await wallet.getSigner();
    const currentAddress = currentSigner.address;
    const signInMsg = `I hereby confirm I am the owner of address ${currentAddress} and accept the ToS for IU-VerCert!\n\nChain ID: ${
      this._networkID
    }\n\nIssued At: ${new Date().toLocaleString()}.`;
    await wallet.send("personal_sign", [signInMsg, currentAddress]);
    return { signer: currentSigner, address: currentAddress };
  }

  getContract(
    signer: ethers.Signer,
    contractDetails: ContractDetails
  ): ethers.Contract | undefined {
    const { abi, address } = contractDetails;
    if (address) {
      return new ethers.Contract(address, abi, signer);
    }
    return;
  }
}

export default new BlockchainServices();
