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


exports.validateWithdraw = (data)=>{
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

exports.validateTransfer = (data)=>{
    if(!data.receiverUserId){
        throw new Error("Receiver user is required");
    }


    if(!data.amount){
        throw new Error("Amount is required");
    }


    if(isNaN(data.amount)){
        throw new Error("Amount must be numeric");
    }


    if(Number(data.amount)<=0){
        throw new Error("Amount must be greater than zero");
    }

};