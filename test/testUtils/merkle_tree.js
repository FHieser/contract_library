// Special Thanks to Raz
//https://github.com/davidrazmadzeExtra/Merkle_Tree_Whitelist_NFT.git

// https://medium.com/@ItsCuzzo/using-merkle-trees-for-nft-whitelists-523b58ada3f9
//
// 1. Import libraries. Use `npm` package manager to install
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

var merkleTree=null;

function setMerkleTree(whitelistAddresses) {
  // 3. Create a new array of `leafNodes` by hashing all indexes of the `whitelistAddresses`
  // using `keccak256`. Then creates a Merkle Tree object using keccak256 as the algorithm.
  let leafNodes = whitelistAddresses.map(addr => keccak256(addr));

  this.merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
}

function getProof(claimingAddress) {
  //the claiming address needs to be hashed with keccak256 to work properly
  claimingAddress = keccak256(claimingAddress);
  return this.merkleTree.getHexProof(claimingAddress);
}

function getRoot() {
  
  return this.merkleTree.getRoot();
}

//Allows the usage of the function outside of the .js file
exports.getProof = getProof;
exports.getRoot = getRoot;
exports.setMerkleTree = setMerkleTree;
