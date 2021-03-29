/* eslint-disable sort-keys */
require('dotenv').config();

const Web3 = require('web3');
const axios = require('axios');
const EthereumTx = require('ethereumjs-tx');
const log = require('ololog').configure({ 'time': true });
const ansi = require('ansicolor').nice;
const fs = require('fs');


/**
 * Network configuration
 */
const network = `${process.env.NETWORK_ADDRESS}`;
const testnet = `https://rinkeby.infura.io/v3/${process.env.INFURA_ACCESS_TOKEN}`;
const MAX_GAS = 2000000;
const MAX_GWEI = '8';

/**
 * Change the provider that is passed to HttpProvider to `mainnet` for live transactions.
 */
const web3 = new Web3(new Web3.providers.HttpProvider(network));
const abi = JSON.parse(fs.readFileSync('abi.json', 'utf8'));

module.exports = router => {

    router.get('/', (req, res) => {

        res.render('index', {
            'description': res.locals.config.description,
            'title': res.locals.config.site_name
        });

    });


    router.get('/api/keypair', (req, res) => {

        const keypair = web3.eth.accounts.create();
        res.json({
            'status': true,
            'msg': '',
            'data': {
                'address': keypair.address,
                'privateKey': keypair.privateKey
            }
        });

    });


    router.get('/api/post/:id', (req, res) => {
        const contract = new web3.eth.Contract(abi, process.env.CONTRACT_ADDRESS);
        contract.methods.getByUUID(req.params.id).call((error, result) => {
            console.log(error);

            res.json({
                'status': true,
                'msg': '',
                'data':                    result

            });
        });
    });

    router.post('/api/post/new', (req, res) => {

        const contract = new web3.eth.Contract(abi, process.env.CONTRACT_ADDRESS);
        const data = contract.methods.newPost(req.body.id, req.body.userId, req.body.data).encodeABI();
        const privateKey = Buffer.from(process.env.WALLET_PRIVATE_KEY, 'hex');

        web3.eth.estimateGas({
            'to': process.env.WALLET_ADDRESS,
            data
        }).then(estimateGas => {

            log(`estimateGas: ${estimateGas}`);

        });

        web3.eth.getTransactionCount(process.env.WALLET_ADDRESS).then(nonce => {

            log(`nonce:${nonce}`);

            const rawTx = {
                nonce,
                'from': process.env.WALLET_ADDRESS,
                'to': process.env.CONTRACT_ADDRESS,
                'gasPrice': web3.utils.toHex(web3.utils.toWei(MAX_GWEI, 'gwei')),
                'gas': MAX_GAS,
                data
            };

            const ethTx = new EthereumTx(rawTx);
            ethTx.sign(privateKey);

            const serializedTx = ethTx.serialize();

            web3.eth.sendSignedTransaction(`0x${serializedTx.toString('hex')}`)
                .once('transactionHash', hash => {

                    log(`transactionHash: ${hash}`);
                    res.json({
                        'status': true,
                        'msg': 'Successfully submitted',
                        'data': {
                            'tx': hash
                        }
                    });

                })
                .once('receipt', receipt => {

                    log(`receipt is ready : ${receipt.transactionHash}`);

                })
                .on('error', error => {

                    log(error);

                })
                .then(receipt => { // Will be fired once the receipt is mined
                    log(`${receipt.transactionHash} is mined`);
                    log(`transactionHash: ${receipt.transactionHash} \nblockHash:  ${receipt.blockHash} \nstatus  : ${receipt.status} , gasUsed  : ${receipt.gasUsed}, blockNumber: ${receipt.blockNumber}, `);
                })
                .catch(error => {
                    log(error.message);
                    res.json({
                        'status': false,
                        'msg': error.message
                    });
                });

        });

    });



};
