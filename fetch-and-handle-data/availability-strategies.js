const axios = require("axios");
const { initDB } = require("../db.js");
const { Strategy, StrategyReorg } = require("../models/index.js");
const dotenv = require("dotenv");
dotenv.config();

const endpointUrl = `${process.env.ENDPOINT_URL || "NA"}`;
const blobTxs = `${endpointUrl}/transactions?sort=desc&type=canonical&p=1&ps=10`;
const blobReorgedTxs = `${endpointUrl}/transactions?sort=desc&type=reorged`;

async function query(url) {
  try {
    console.log(`===querying ${url}===`);
    const res = await axios.get(url);
    console.log(`===get response: ${new Date()}===`);
    return [true, res.data.transactions];
  } catch (error) {
    // Catch and log error
    const errorMsg = `Error when querying ${url}. Error code: ${error?.code}, Error message: ${error?.message}`;
    console.error(errorMsg);
    return [false, []];
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function handleTx(tx, rollupMap) {
  const {
    hash,
    blockNumber,
    blockHash,
    rollup,
    block,
    blobGasUsed,
    blobAsCalldataGasUsed,
    blobGasBaseFee,
    blobAsCalldataGasFee,
  } = tx;
  const rollupKey = rollup ?? "Others";
  let blobInterval = -1;
  if (rollupMap.has(rollupKey)) {
    if (rollupMap.get(rollupKey)[1] == blockNumber) {
      if (rollupMap.get(rollupKey)[0] == 0) {
        blobInterval = -1;
      } else {
        blobInterval = blockNumber - rollupMap.get(rollupKey)[0];
      }
    } else {
      blobInterval = blockNumber - rollupMap.get(rollupKey)[1];
      rollupMap.set(rollupKey, [rollupMap.get(rollupKey)[1], blockNumber]);
    }
  } else {
    rollupMap.set(rollupKey, [0, blockNumber]);
  }
  const blobCount = blobGasUsed / 131072;
  const { blobGasPrice } = block;
  // blobGasUsed = 1*zeroBytes + 1*nonzeroBytes + 1*emptyZeroBytes = dataBytes + emptyZeroBytes
  // blobAsCalldataGasUsed = 4*zeroBytes + 16*nonzeroBytes = (4(1-k)+16k) * dataBytes = (4+12k) * dataBytes [0<=k<=1]
  // let w = 4+12k [4 <= w <= 16], we get r = blobAsCalldataGasUsed / blobGasUsed = wf [f: data percentage]
  const gasRatio = blobAsCalldataGasUsed / blobGasUsed; // gasRatio up -> data percentage up
  const feeRatio = blobAsCalldataGasFee / blobGasBaseFee;
  return {
    hash,
    blockNumber,
    blockHash,
    blobCount,
    rollup: rollupKey,
    blobGasPrice,
    blobInterval,
    gasRatio, // 0 <= gasRatio <= 16
    feeRatio,
  };
}

// https://api.sepolia.blobscan.com/transactions?sort=desc&startBlock=0&endBlock=100&type=canonical&p=1&ps=100
async function fetchBlobTxs(params, rollupMap) {
  const { sort, startBlock, endBlock, type, startPage, pageSize } = params;
  const Table = type === "canonical" ? Strategy : StrategyReorg;
  console.log("==== params ====");
  console.log(params);
  let page = startPage;
  let txs = [];
  do {
    console.log("Rollup Map:");
    console.log(rollupMap);
    const blobTxsUrl = `${endpointUrl}/transactions?sort=${sort}${
      !!startBlock ? `&startBlock=${startBlock}` : ""
    }${
      !!endBlock ? `&endBlock=${endBlock}` : ""
    }&type=${type}&p=${page}&ps=${pageSize}`;
    [ok, txs] = await query(blobTxsUrl);
    if (!ok) {
      console.log("Retry");
      await sleep(10000);
      continue;
    }
    const data = txs.map((tx) => handleTx(tx, rollupMap));
    console.log("Updating page", page);
    await Table.bulkCreate(data);
    console.log("Update success", page);
    page += 1;
  } while (!ok || txs.length != 0);
  console.log("Finish");
}

// 1716349506988
// https://api.sepolia.blobscan.com/#/transactions/tx-getAll
// https://api.sepolia.blobscan.com/transactions?sort=desc&startBlock=0&endBlock=100&type=canonical&p=1&ps=100
const params = {
  sort: "asc",
  startBlock: 0,
  endBlock: 0,
  type: "canonical",
  //type: "reorged",
  startPage: 1,
  pageSize: 1000,
};

async function run() {
  await initDB();
  await fetchBlobTxs(params, new Map());
}

run();
