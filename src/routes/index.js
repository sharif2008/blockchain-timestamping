/* eslint-disable sort-keys */
require('dotenv').config();

const Web3 = require('web3');
const axios = require('axios');
const EthereumTx = require('ethereumjs-tx').Transaction;
const log = require('ololog').configure({ 'time': true });
const ansi = require('ansicolor').nice;
const fs = require('fs');


/**
 * Network configuration
 */
const network = `${process.env.NETWORK_ADDRESS}`;
const testnet = `https://ropsten.infura.io/v3/${process.env.INFURA_ACCESS_TOKEN}`;
const MAX_GAS = 2000000;
const MAX_GWEI = '20';

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

    router.get('/sign', (req, res) => {

        res.render('sign', {
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


    router.get('/api/certificate/:id', (req, res) => {
        const contract = new web3.eth.Contract(abi, process.env.CONTRACT_ADDRESS);
        contract.methods.getByUUID(req.params.id).call((error, result) => {
            if (error) {
                console.log(error);
                res.json({
                    'status': false,
                    'msg': error.message
                });

            } else {
                res.json({
                    'status': true,
                    'data': result
                });
            }
        });
    });

    router.post('/api/certificate/new', async (req, res) => {

        const contract = new web3.eth.Contract(abi, process.env.CONTRACT_ADDRESS);
        const data = contract.methods.issueCertificate(req.body.uuid, req.body.docId, req.body.hash).encodeABI();
        //console.log(data);
        const privateKey = Buffer.from(process.env.WALLET_PRIVATE_KEY, 'hex');

        web3.eth.estimateGas({
            'to': process.env.WALLET_ADDRESS,
            data
        }).then(estimateGas => {

            log(`estimateGas: ${estimateGas}`);

        });

        let nonce = await web3.eth.getTransactionCount(process.env.WALLET_ADDRESS);

        log(`nonce:${nonce}`);

        const rawTx = {
            nonce: nonce,
            'from': process.env.WALLET_ADDRESS,
            'to': process.env.CONTRACT_ADDRESS,
            'gasPrice': web3.utils.toHex(web3.utils.toWei(MAX_GWEI, 'gwei')),
            'gas': MAX_GAS,
            data
        };

        const ethTx = new EthereumTx(rawTx, { 'chain': 'ropsten' });
        ethTx.sign(privateKey);

        const serializedTx = ethTx.serialize();


        web3.eth.sendSignedTransaction(`0x${serializedTx.toString('hex')}`)
            .once('transactionHash', hash => {
                log(`transactionHash: ${hash}`);
                return res.json({
                    'status': true,
                    'msg': 'Successfully submitted. Please wait until it gets mined.',
                    'data': {
                        'tx': hash,
                        'uuid': req.body.uuid
                    }
                });

            })
            .once('receipt', receipt => {
                log(`receipt is ready : ${receipt.transactionHash}`);
            })
            .on('error', error => {
                log('err:' + error.message);
            })
            .then(receipt => { // Will be fired once the receipt is mined
                log(`${receipt.transactionHash} is mined`);
                log(`transactionHash: ${receipt.transactionHash} \nblockHash:  ${receipt.blockHash} \nstatus  : ${receipt.status} , gasUsed  : ${receipt.gasUsed}, blockNumber: ${receipt.blockNumber}, `);
            })
            .catch(error => {
                log(error.message);
                return res.json({
                    'status': false,
                    'msg': error.message
                });
            });

    });

};
