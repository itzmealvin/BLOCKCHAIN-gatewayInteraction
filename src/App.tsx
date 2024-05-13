import { zodResolver } from "@hookform/resolvers/zod";
import "bootstrap/dist/css/bootstrap.css";
import { Contract } from "ethers";
import { BrowserProvider } from "ethers/providers";
import { useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { z } from "zod";
import gatewayABI from "../contracts/Gateway.json";
import BlockchainServices from "./services/BlockchainServices";

const schema = z.object({
  contract: z.string(),
});

type FormData = z.infer<typeof schema>;

function App() {
  const [address, setAddress] = useState("");
  const [hash, setHash] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [gatewayContract, setGatewayContract] = useState<Contract | null>(null);
  const browserWallet = BlockchainServices.getProvider() as BrowserProvider;

  const handleClick = async () => {
    if (browserWallet) {
      if (!(await BlockchainServices.isOnRightNetwork(browserWallet))) {
        await BlockchainServices.switchNetwork(browserWallet);
      }
      const signer = await browserWallet.getSigner();
      setGatewayContract(
        new Contract(
          "0xF871c929bE8Cd8382148C69053cE5ED1a9593EA7",
          gatewayABI,
          signer
        )
      );
      setAddress(signer.address);
    }
  };

  const { register, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FieldValues) => {
    setLoading(true);
    const execPromise = gatewayContract!.submitMessage(
      data.contract,
      5,
      100_000,
      "0x"
    );
    toast
      .promise(execPromise, {
        pending: "Sending transaction",
        success: "Transaction submitted 👌",
        error: "Transaction failed 🤯",
      })
      .then((transaction) => setHash(transaction.hash))
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="container text-center col algin-item-center mb-3">
      <h1 className="display-1">ASTAR GATEWAY APP</h1>
      <button
        className="btn btn-primary"
        onClick={handleClick}
        disabled={address !== ""}
      >
        Connect Wallet
      </button>
      {address !== "" && <h2>Connected Address: {address}</h2>}
      <form className="row g-3" onSubmit={handleSubmit(onSubmit)}>
        <label className="form-label" htmlFor="contract">
          Your deployed contract (on Shibuya){" "}
        </label>
        <input className="form-control" {...register("contract")} type="text" />
        <button type="submit" className="btn btn-secondary">
          {isLoading ? (
            <>
              <span
                className="spinner-border spinner-border-sm"
                aria-hidden="true"
              ></span>
              <span role="status">Mining transaction...</span>
            </>
          ) : (
            "Submit"
          )}
        </button>
      </form>
      {hash !== "" && <h3>Transaction hash: {hash}</h3>}

      <ToastContainer
        stacked
        position="bottom-right"
        autoClose={1000}
        hideProgressBar
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="colored"
      />
      <h4>Support my work: 0x24B00B5987Ae6A5b7a8c73671332b938433fA7D9.</h4>
    </div>
  );
}

export default App;
