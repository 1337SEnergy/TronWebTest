var contractAddress = "TYrCYrkUmKw7yMNAif4TTJy2xmYa8HL3zw";
var contract = null;
var _result = null;

$(document).ready(function()
{
	var referral = getUrlParameter("r");
	if(referral !== undefined && referral !== null) Cookies.set("referral", referral);
	
	var tries = 0;
	var obj = setInterval(async () =>
	{
		if (window.tronWeb && window.tronWeb.defaultAddress.base58)
		{
			clearInterval(obj);
			$(".load").attr("hidden", true);
			
			// $(".connect-section").removeAttr("hidden");
			
			window.tronWeb.contract().at(contractAddress).then(function(result)
			{
				contract = result;
				
				contract.participants(window.tronWeb.defaultAddress.base58).call().then(function(result)
				{
					var deposit = parseInt(result.deposit._hex);
					if(deposit == 0)
					{
						initDepositSection();
						$(".deposit-section").removeAttr("hidden");
					}
					else
					{
						initUserSection(result);
						$(".user-section").removeAttr("hidden");
					}
				});
				
				
			}, function(error)
			{
				alert(`getting contract at ${contractAddress} failed`);
			});
			
			return;
		}
		
		if(tries == 5)
		{
			clearInterval(obj);
			$(".load").attr("hidden", true);
			$(".error").removeAttr("hidden");
			return;
		}
		tries += 1;
		
	} , 500);
})

function initDepositSection()
{
	if(contract === null)
		return;

	window.tronWeb.trx.getBalance(contract.address).then(result => $("#contract-balance-deposit").text(`${result/1000000} TRX`));
	contract.total_withdrawn().call().then(result => $("#contract-withdrawn-deposit").text(`${parseInt(result)/1000000} TRX`));
}

$("#deposit-amount").keyup(function()
{
	if($(this).val().length !=0)
	{ $("#deposit-button").attr("disabled", false); }
	else
	{ $("#deposit-button").attr("disabled", true); }
})

$("#deposit-button").click(function()
{
	if(contract === null)
		return;

	var amount = $("#deposit-amount").val();
	amount = parseInt(amount)*1000000;
	
	var referral = Cookies.get("referral");
	if(referral !== undefined && !window.tronWeb.isAddress(referral))
		referral = undefined;
	
	if(referral === undefined)
	{ contract.deposit().send({feeLimit:2000000, callValue:amount, shouldPollResponse:true}); }
	else
	{ contract.methods["deposit(address)"](referral).send({feeLimit:2000000, callValue:amount, shouldPollResponse: false}); }
});

function initUserSection(user)
{
	if(contract === null)
		return;
	
	window.tronWeb.trx.getBalance(contract.address).then(result => $("#contract-balance-user").text(`${result/1000000} TRX`));
	contract.total_withdrawn().call().then(result => $("#contract-withdrawn-user").text(`${parseInt(result)/1000000} TRX`));
	
	$("#user-deposit").text(`${parseInt(user.deposit._hex)/1000000} TRX`);
	$("#user-withdrawn").text(`${parseInt(user.withdrawn_reward._hex)/1000000} TRX`);
	
	$("#referred-users").text(`${parseInt(user.referrals._hex)} users`);
	$("#referral-reward").text(`${parseInt(user.withdrawn_referral_bonus._hex)/1000000} TRX`);
	
	contract.getCurrentReward(window.tronWeb.defaultAddress.base58).call().then(result => $("#possible-withdrawal").text(`${(parseInt(result[0])+parseInt(result[1]))/1000000} TRX`));
	
	$("#withdrawal-maximum").text(`${(parseInt(user.max_reward._hex)-parseInt(user.withdrawn_reward._hex))/1000000} TRX`);
	
	contract.referral_reward_pct().call().then(result => $("#referral-percentage").text(`${parseInt(result)} %`));
	
	var next_withdrawal = parseInt(user.next_withdrawal._hex);
	if(Date.now()/1000 > next_withdrawal)
		$("#withdraw-button").removeAttr("disabled");

	$("#referral-link").text(`${window.location.origin}?r=${window.tronWeb.defaultAddress.base58}`);
	$("#referral-link").attr("href", `${window.location.origin}?r=${window.tronWeb.defaultAddress.base58}`);
}

$("#withdraw-button").click(function()
{
	if(contract === null)
		return;
	
	contract.withdraw().send({feeLimit:2000000, shouldPollResponse: false});
});

function getUrlParameter(sParam)
{
	var sPageURL = window.location.search.substring(1), sURLVariables = sPageURL.split('&'), sParameterName, i;

	for (i = 0; i < sURLVariables.length; i++)
	{
		sParameterName = sURLVariables[i].split('=');

		if (sParameterName[0] === sParam)
		{ return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]); }
	}
};
