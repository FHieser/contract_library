// Special Thanks to Raz
//https://github.com/davidrazmadzeExtra/Merkle_Tree_Whitelist_NFT.git

// https://medium.com/@ItsCuzzo/using-merkle-trees-for-nft-whitelists-523b58ada3f9
//
// 1. Import libraries. Use `npm` package manager to install
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

// 2. Collect list of wallet addresses from competition, raffle, etc.
// Store list of addresses in some data sheeet (Google Sheets or Excel)
const whitelistAddresses = [
  "0xD5E5A6eb56e4B41661Dccc225d1B3C9Ed93D952C",//original
  "0x14590dF80495714d708FBad4d11f8582a10226a8",//test
  "0X5B38DA6A701C568545DCFCB03FCB875F56BEDDC4",
  "0X5A641E5FB72A2FD9137312E7694D42996D689D99",
  "0XDCAB482177A592E424D1C8318A464FC922E8DE40",
  "0X6E21D37E07A6F7E53C7ACE372CEC63D4AE4B6BD0",
  "0X09BAAB19FC77C19898140DADD30C4685C597620B",
  "0XCC4C29997177253376528C05D3DF91CF2D69061A",
  "0xdD870fA1b7C4700F2BD7f44238821C26f7392148" // The address in remix
];

0x10ffd411b9bf9635a654c97b60b00a647d67ffed7abb1e620ae074f2fc263d61;

// 3. Create a new array of `leafNodes` by hashing all indexes of the `whitelistAddresses`
// using `keccak256`. Then creates a Merkle Tree object using keccak256 as the algorithm.
//
// The leaves, merkleTree, and rootHas are all PRE-DETERMINED prior to whitelist claim
const leafNodes = whitelistAddresses.map(addr => keccak256(addr));
const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });

// 4. Get root hash of the `merkleeTree` in hexadecimal format (0x)
const rootHash = merkleTree.getRoot();
console.log("Root Hash: ",rootHash);

function getProof(claimingAddress) {

  //the claiming address needs to be hashed with keccak256 to work properly
  claimingAddress= keccak256(claimingAddress);

  const hexProof = merkleTree.getHexProof(claimingAddress);

  const isVerified = merkleTree.verify(hexProof, claimingAddress, rootHash);

  return {isVerified, hexProof};
}

function getRoot(){
  return rootHash;
}

//Allows the usage of the function outside of the .js file
exports.getProof = getProof;
exports.getRoot = getRoot;