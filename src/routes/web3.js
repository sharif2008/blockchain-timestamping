require('dotenv').config();

const Web3 = require('web3');
const network = `${process.env.NETWORK_ADDRESS}`;
const testnet = `https://rinkeby.infura.io/v3/${process.env.INFURA_ACCESS_TOKEN}`
const web3 = new Web3(new Web3.providers.HttpProvider(network));

module.exports = router => {

    router.get('/', (req, res) => {
        res.json({
            network
        });

    });
    router.get('/network', (req, res) => {
        web3.eth.net.getNetworkType((err, networkType) => {
            res.json({
                networkType
            });
        });
    });


    router.get('/balance/:address', (req, res) => {

        web3.eth.getBalance(req.params.address)
            .then(result => {

                const balance = web3.utils.fromWei(web3.utils.toBN(result), 'ether');
                res.json({
                    'status': true,
                    'msg': '',
                    'data': {
                        balance,
                        'unit': 'ETH'
                    }
                });

            });

    });


    router.get('/receipt/:tx', (req, res) => {

        web3.eth.getTransactionReceipt(req.params.tx)
            .then((receipt) => {
                res.json({
                    receipt
                });
            }).catch((error) => {
                res.json({
                    error
                });
            });
    });


    router.get('/address/:address', (req, res) => {
        var result = web3.utils.isAddress(req.params.address);
        res.json({
            result
        })
    });

};
