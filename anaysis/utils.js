import { strategyDataReorg } from "./data/StrategiesReorg.js";

export const getDataMappingByRollup = (data) => {
  const rollupMap = new Map();
  data.forEach(
    ({
      blockNumber,
      blobCount,
      rollup,
      blobGasPrice,
      blobInterval,
      gasRatio,
      feeRatio,
    }) => {
      const info = {
        blockNumber,
        blobCount,
        blobGasPrice,
        blobInterval,
        gasRatio,
        feeRatio,
        rollup,
      };
      if (rollupMap.has(rollup)) {
        rollupMap.set(rollup, [...rollupMap.get(rollup), info]);
      } else {
        rollupMap.set(rollup, [info]);
      }
    }
  );
  return rollupMap;
};

/*
{
            label: "散点图实例",
            data: [
              {
                x: -10,
                y: 0,
              },
              {
                x: 0,
                y: 10,
              },
              {
                x: 10,
                y: 5,
              },
              {
                x: 0.5,
                y: 5.5,
              },
            ],
            backgroundColor: "rgb(255, 99, 132)",
          }
*/
export const getListByMap = (map, getXy) => {
  return [...map.keys()].map((key) => ({
    label: key,
    data: map.get(key).map((e) => getXy(e)),
    backgroundColor: getRollupRGB(key),
  }));
};

const rollupRGBMap = new Map([
  ["optimism", "rgb(255, 99, 132)"],
  ["linea", "rgb(255, 159, 64)"],
  ["arbitrum", "rgb(255, 205, 86)"],
  ["zora", "rgb(75, 192, 192)"],
  ["starknet", "rgb(54, 162, 235)"],
  ["Others", "rgb(153, 102, 255)"],
  ["base", "rgb(201, 203, 207)"],
  ["paradex", "rgb(128, 42, 42)"],
  ["scroll", "rgb(221, 160, 221)"],
  ["zksync", "rgb(11, 23, 70)"],
  ["kroma", "rgb(156, 102, 31)"],
  ["metal", "rgb(176, 48, 96)"],
  ["boba", "rgb(255, 235, 205)"],
  ["mode", "rgb(112, 128, 105)"],
  ["camp", "rgb(0, 199, 140)"],
  ["pgn", "rgb(255, 0, 255)"],
]);

export const getRollupRGB = (rollup) => {
  return rollupRGBMap.get(rollup);
};

// [1 min, 1 h, 1 d, 1 w, 1 m]
// const threadholds = [
//   0,
//   5,
//   5 * 60,
//   5 * 60 * 24,
//   5 * 60 * 24 * 7,
//   5 * 60 * 24 * 30,
// ];
export const getDistribution = (rollupMap, threadholds, getElement) => {
  const rollups = Array.from(rollupMap.keys());
  const percentsList = rollups.map((rollup) => {
    const rList = rollupMap.get(rollup);
    const counts = rList.reduce((countList, target) => {
      const i = threadholds.findIndex((e) => getElement(target) < e);
      if (i > 0) {
        countList[i - 1] += 1;
      }
      return countList;
    }, new Array(threadholds.length - 1).fill(0));
    const sum = counts.reduce((partialSum, a) => partialSum + a, 0);
    const percents = counts.map((e) => (e / sum) * 100);
    return percents;
  });
  console.log(rollups);
  console.log(percentsList);
  return [rollups, percentsList];
};

export const getRollupDistribution = (
  rollupMap,
  threadholds,
  getElement,
  getReturn
) => {
  const rollups = Array.from(rollupMap.keys());
  return [
    rollups,
    threadholds.map((threadhold) => {
      const targets = rollups.map((rollup) => {
        const target = rollupMap
          .get(rollup)
          .filter(
            (e) =>
              threadhold[0] <= getElement(e) && getElement(e) < threadhold[1]
          );
        return target;
      });
      // [[rollup 1 data], [rollup 2 data]]
      const rollupCounts = targets.map((rollupTargets) => {
        const counts = rollupTargets.map((target) => getReturn(target));
        const sum = counts.reduce((partialSum, a) => partialSum + a, 0);
        return sum;
      });
      // [rollup 1 count, rollup 2 count]
      const rollupSum = rollupCounts.reduce(
        (partialSum, a) => partialSum + a,
        0
      );
      const percents = rollupCounts.map((e) => (e / rollupSum) * 100);
      return percents;
    }),
  ];
};

function getRGBcolor() {
  const R = Math.floor(Math.random() * 256);
  const G = Math.floor(Math.random() * 256);
  const B = Math.floor(Math.random() * 256);
  const randomcolor = "rgb(" + R + "," + G + "," + B + ")";
  return randomcolor;
}
