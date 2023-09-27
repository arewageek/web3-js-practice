const { Block } = require('bitcore-lib')
const express = require('express')
const {Web3} = require('web3')
require('dotenv').config()

const app = express()

const ganache = 'localhost:8595'
const port = process.env.PORT || 5000   

const providers = new Web3.providers.HttpProvider(process.env.INFURA_COMPLETE_URL)  
const web3 = new Web3(providers)

app.get('/', async (req, res) => {
    const accounts = await web3.eth.getAccounts()
    res.json(accounts)
})

app.get('/balance', async(req, res) => {
    const balanceInWei = await web3.eth.getBalance(req.query.account)
    const balanceInEth = await web3.utils.fromWei(balanceInWei, 'ether')
    // res.send(balanceInWei)
    console.log(`Balance in Wei: ${balanceInWei} wei`)
    console.log(`Balance in Ethers  : ${balanceInEth} eth`)

    res.status(200).json({
        eth: balanceInEth
    })
})

app.get('/send', async (req, res) => {
    const { query } = req
    const amount = query.amount
    const weiAmount = await web3.utils.toWei(amount, 'ether')


    const balance = web3.eth.getBalance(query.from)

    if(balance < weiAmount){
        res.status(400).json({error: "Insufficient balance"})
    }
    
    const transactionObject = {
        from: query.from,   
        to: query.to,
        value: weiAmount,
        gas: 21000,
        gasPrice: '0x1000000000',
        nonce: `${await web3.eth.getTransactionCount(query.from, 'latest')}`
    }

    // res.send(await web3.)
    const signedTx = await web3.eth.accounts.signTransaction(transactionObject, 'b14094f07864c502c0ecd2003730f778d167b4b44cf7a77541cf1405cbddc13a')
        // .on('transactionHash', (transactionHash) => {
        //     console.log('Transaction hash:', transactionHash);
        //     res.json({ transactionHash });
        // })
        // .on('error', (error) => {
        //     // console.error('Error sending transaction:', error.reason);
        //     res.status(500).json({ error: 'Transaction failed', note: error.reason });
        // });

        
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    console.log(receipt)

})

app.get('/wallet/create', async (req, res) => {
    const account = web3.eth.accounts.create()
    res.json(account)
    console.log(account)
})

app.get('/transactions', async (req, res) => {
    const { query } = req
    const wallet = query.wallet

    const block = await web3.eth.getBlock('latest')
    const blockNumber = block.number

    if(blockNumber != null){
        for(let trxHash of block.transactions){
            console.log(trxHash)
            const transaction = await web3.eth.getTransaction(trxHash)
            console.log(transaction)
        }
    }
    
    // console.log(transactions)
})

app.listen(port, () => {
    console.log(`Listening on Port: ${port}`)
})