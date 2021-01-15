const axios = require('axios')
const express = require('express');
const regression = require('regression')
const http = require('http')
const fs = require('fs')

const parse = require('csv-parse/lib/sync');
const { response } = require('express');

const app = express();
const port = process.env.PORT || 3000;
records = null
THI = null

node = 'node_01'

app.get('/',  async (req, res, next) => {
    var webhookURL = "https://9y8wy7m8tc.execute-api.us-east-2.amazonaws.com/webhook";
    var date = new Date().toDateString();
    console.log(date)
    records = await getRecords()
    res.send(records)
});

app.get('/reg_thi_bug',  async (req, res, next) => {
    if(records == null){
        records = await getRecords()
    }

    node_thi_pest = records.map(rec => { 
        validate = node + '_pestnum'
        temp = node + '_temp'
        rh = node + '_rh'
        time = '__dt'
        if(rec[validate] != ''){
            RH = parseFloat(rec[rh])/100
            T = parseFloat(rec[temp])
            TD = Math.pow(RH, 1/8) * (112 + 0.9 *T) + 0.1 * T - 112
            THI = T - 0.55 * (1- Math.exp(17.269*TD/(TD+237.3))/Math.exp(17.269*T/(T+237.3)) ) * (T-14)
            bugNum = rec[validate]
            return [parseFloat(THI.toFixed(2)), parseInt(bugNum)]
        }
    });
// (Lux * THI^4 + 10 ) / VOC^2 * e^(1/CO2)
    node_thi_pest = node_thi_pest.filter(Boolean) 
    const result = regression.linear(node_thi_pest);
    console.log(result)
    r = {rawData: node_thi_pest, equation: result.equation, equation_string: result.string}
    res.send(r)
});

app.get('/thi',  async (req, res, next) => {
    if(records == null){
        records = await getRecords()
    }

    node_temp_pest = records.map(rec => { 
        validate = node + '_pestnum'
        temp = node + '_temp'
        rh = node + '_rh'
        time = node + '_time'
        if(rec[validate] != ''){
            RH = parseFloat(rec[rh]) / 100
            T = parseFloat(rec[temp])
            TD = Math.pow(RH, 1/8) * (112 + 0.9 *T) + 0.1 * T - 112
            THI = T - 0.55 * (1- Math.exp(17.269*TD/(TD+237.3))/Math.exp(17.269*T/(T+237.3)) ) * (T-14)
            return [rec[time], parseInt(THI.toFixed(2))]
        }
    });
    node_temp_pest = node_temp_pest.filter(Boolean) 
    res.send(node_temp_pest)
});


async function getRecords(){
    // <-- web version -->
    /* var webhookURL = "https://5jstdu4jn7.execute-api.us-east-1.amazonaws.com/prod";
    res= await axios.get(
        webhookURL
    ).then(async (response)=>{    
        return await axios.get(response.data)
    }).then((response)=>{
        csvstring = response.data
        records = parse(csvstring, {columns: false})
        // console.log(records)
        return records
    }).catch((error) => { console.error(error) }); 
    return res */

    // <-- local version -->
    csvstring = fs.readFileSync('data.csv', 'utf8');
    recs = parse(csvstring, {columns: true});
    return recs
}

http.createServer(app).listen(port, function(){
    console.log("Express server listening on port " + port);
});