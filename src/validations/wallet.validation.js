exports.validateDeposit = (data)=>{
    if(!data.amount){
        throw new Error(
            "Amount is required"
        );
    }

    if(isNaN(data.amount)){
        throw new Error(
            "Amount must be numeric"
        );
    }

    if(Number(data.amount)<=0){
        throw new Error(
            "Amount must be greater than zero"
        );
    }
};