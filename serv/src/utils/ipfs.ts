const IPFS = require('ipfs-core')

const createIPFS = async () => {
    const ipfs = await IPFS.create()
    return ipfs;
}

const ipfs = createIPFS();

module.exports = {
    ipfs
}

