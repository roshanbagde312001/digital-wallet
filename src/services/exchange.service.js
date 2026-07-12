const axios = require("axios");

exports.getExchangeRate = async(fromCurrency,toCurrency)=>{
    console.log("rspaj",fromCurrency)
    if(fromCurrency === toCurrency){
        return 1;
    }
    try{
        const response =await axios.get(`https://api.frankfurter.app/latest`,{
                params:{
                    from:fromCurrency,
                    to:toCurrency
                }
            }
        );


        const rate =
        response.data.rates[toCurrency];
        if(!rate){
            throw new Error(
                "Exchange rate not found"
            );
        }
        return rate;
    }
    catch(error){
        console.log(
            "Exchange API Error:",
            error.message
        );
        throw new Error(
            "Unable to fetch exchange rate"
        );
    }
};