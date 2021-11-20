// https://github.com/miguelmota/merkletreejs-solidity
require('dotenv').config()
import express from "express";
// import Web3 from 'web3';
import { ethers } from "ethers";
import { HideServVault as HideServVaultType } from './typechain/HideServVault'
const fs = require('fs').promises;
const path = require('path');
import mongoose from 'mongoose';
const amqp = require('amqplib/callback_api');
import utmToLatLng from './utils/utmToLatLng';
import hideWorldWide from './task/hideWorldWide';
import MerkleTree from 'merkletreejs';
import keccak256 from 'keccak256';
import geohash  from "ngeohash";
import CID from 'cids';
const { ipfs } = require("./utils/ipfs");


import TreasureModel from './models/treasure.model'

(async () => {
  //@ts-ignore
  mongoose.connect("mongodb://localhost:27017/th_dev", { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
  console.log("Connected to MongoDB")
  amqp.connect('amqp://guest:guest@localhost?heartbeat=0', async (err:any, conn:any) => {
    conn.createChannel(async (err:any, ch:any) => {

      const events = 'eventsq';
      ch.assertQueue(events, { durable: true });

      const results = 'resultsq';
      ch.assertQueue(results, { durable: true });


    const wsProvider = new ethers.providers.WebSocketProvider("wss://kovan.infura.io/ws/v3/16730a405a254c81b8721025f50b815f", { name: "kovan", chainId: 42 });
    // wsProvider.on("block", (block) => console.log(block));

    const wallet = new ethers.Wallet("b156f0e57c7ce7fb7608d4b1d7cf9eb4e944734ae19a1c29ef922f4932025c06", wsProvider) 
    const rawData = await fs.readFile(path.join(__dirname, 'data', 'kovan.json'));
    const data = JSON.parse(rawData);

    const hideServContract = new ethers.Contract(data.contracts.HideServVault.address, data.contracts.HideServVault.abi, wallet) as HideServVaultType;
  
    // get random location function
    const getLocation = async () => {
      try {
        const result:any = await hideWorldWide(1)
        const location = `${result.name}, ${result.countryName}`
        // if(result !== undefined) console.log(location)
        if(result !== undefined) return location;
      } catch(err) {
        console.error(err)
        const location = await getLocation();
        return location;
      }
    }
  
    // listen to events on HideServVault
    hideServContract.on("NewTreasure", async (nftContract, tokenId, contractStandard) => {
      console.log("New treasure received")
      console.log(nftContract)
      console.log(tokenId)
      console.log(contractStandard)
      const location = await getLocation();
      console.log(`New treasure on contract ${nftContract} with ID ${tokenId} of type ${contractStandard} will be hidden in ${location}`)
      const dataToProcess = { 
        nftContract: nftContract,
        tokenId: tokenId.toNumber(),
        contractStandard: contractStandard,
        location: location
      }
      // send for processing
      ch.sendToQueue(events, new Buffer(JSON.stringify(dataToProcess)));
    })
    console.log("Listening to events...")

    //test above
    const testEventChain = async () => {
      console.log("New treasure received")
      const nftContract = "0x0000000000000000000000000000000000000000"
      const tokenId = 0;
      const contractStandard = "ERC721"
      // console.log(nftContract)
      // console.log(tokenId)
      // console.log(contractStandard)
      const location = await getLocation();
      console.log(`New treasure on contract ${nftContract} with ID ${tokenId} of type ${contractStandard} will be hidden in ${location}`)
      const dataToProcess = {
        nftContract: nftContract,
        tokenId: tokenId,
        contractStandard: contractStandard,
        location: location
      }
      ch.sendToQueue(events, new Buffer(JSON.stringify(dataToProcess)));
    }
    // testEventChain()

    // consume responses
    ch.consume(results, async function (msg:any) {
      const response = JSON.parse(msg.content.toString());
      console.log(response)
      if(msg.error === 'true') {
        const location = await getLocation();
        console.log(`Retrying: new treasure on contract ${response.nftContract} with ID ${response.tokenId} of type ${response.contractStandard} will be hidden in ${location}`)
        const dataToProcess = { 
          nftContract: response.nftContract,
          tokenId: response.tokenId,
          contractStandard: response.contractStandard,
          location: location
        }
        // send for processing (again)
        ch.sendToQueue(events, new Buffer(JSON.stringify(dataToProcess)));
      } else {
      const newTreasure = {
        contract: response.nftContract,
        tokenId: response.tokenId,
        contractStandard: response.contractStandard,
        geoHash: geohash.encode(response.coords[0], response.coords[1])
      }


      // const imgdata = fs.readFileSync('./ipfsTest/alienFriend.png');
      const ipfsx = await ipfs;

      const newLocation = {
          "geohash": `${newTreasure.geoHash}`
      }
      
      const nftCID = await ipfsx.add(JSON.stringify(newLocation))
      const createdTreasure = await TreasureModel.create({ ...newTreasure, cid: nftCID });

      console.log(nftCID)
    }

    }, { noAck: true });


    const transformTreasure = async (treasure) => {
      const treasureTransformed = treasure.transform();
      const treasureData = [
        { type: 'address', value: treasureTransformed.contract },
        { type: 'uint256', value: treasureTransformed.tokenId },
        { type: 'string', value: treasureTransformed.contractStandard },
        { type: 'string', value: treasureTransformed.geoHash },
      ]
      return keccak256(treasureData);
    }

    const constructMerkleTree = async () => {
      // const newTreasure = {
      //   contract: "0x0000000000000000000000000000000000000000",
      //   tokenId: 0,
      //   contractStandard: "ERC721",
      //   geoHash: geohash.encode(37.8324, 112.5584)
      // }
      // const treasure1 = await TreasureModel.create(newTreasure);
      // const treasure2 = await TreasureModel.create(newTreasure);

      const treasures = await TreasureModel.find({})

      const filteredTreasures = treasures.map((treasure) => {
        const treasureTransformed = treasure.transform();
        const treasureData = [
          { type: 'address', value: treasureTransformed.contract },
          { type: 'uint256', value: treasureTransformed.tokenId },
          { type: 'string', value: treasureTransformed.contractStandard },
          { type: 'string', value: treasureTransformed.geoHash },
        ]
        return treasureData;
      })

      // console.log(filteredTreasures)

      const leaves = filteredTreasures.map(treasure => {
        return keccak256(treasure)
      })
      // console.log(leaves)

      const tree = new MerkleTree(leaves, keccak256, { sort: true })
      const root = tree.getHexRoot()
      // console.log(root)

      // get a proof
      const leafTreasure = await TreasureModel.findOne({ contract: "0x0000000000000000000000000000000000000000" })
      // console.log(leafTreasure)
      const leaf = await transformTreasure(leafTreasure)
      // console.log(leaf)
      const proof = tree.getHexProof(leaf)
      // console.log(proof)

      //verify that leaf is in the tree
      console.log(tree.verify(proof, leaf, root))

      console.log(tree.toString())
    }

    constructMerkleTree();

    });
  });
});
})();



// const web3 = new Web3('ws://minthunt.io:9545');

// web3.eth.getAccounts().then(console.log);
// const hideServContract = new web3.eth.Contract(data.contracts.HideServVault.abi as AbiItem, data.contracts.HideServVault.address)
// hideServContract.events.NewTreasure((err: any, events: any)=> {
//   console.log(err, events)
// })
// function callD_alembert(req:any, res:any) {
//   var input = [
//     "text"
//   ]
//   amqp.connect('amqp://localhost', function (err:any, conn:any) {
//     conn.createChannel(function (err:any, ch:any) {
//       const events = 'events';
//       ch.assertQueue(events, { durable: false });

//       const results = 'results';
//       ch.assertQueue(results, { durable: false });

//       ch.sendToQueue(events, new Buffer(JSON.stringify(input)));
      
//       ch.consume(results, function (msg:any) {
//         res.send(msg.content.toString())
//       }, { noAck: true });
//     });
//     setTimeout(function () { conn.close(); }, 500); 
//     });
// }
  
////
const app = express();
const PORT = 8945;

app.get("/", (req: express.Request, res: express.Response) => {
  res.send("hideServ");
});

// app.get('/test', callD_alembert);


app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
