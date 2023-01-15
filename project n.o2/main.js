
var myModal = new bootstrap.Modal(document.getElementById('savedCoinsModal'))


let savedCoins=getSavedCoins()

//return coin card html template
function coinCardTemplate(coin) {
    let checked = (isCoinChecked(coin.id)) ? "checked" : "";
    return `<div class="col-md-3">
        <div class="card coin-card mb-4" data-id="`+coin.id+`">
            <div class="card-body">
                <div class="h3">`+coin.symbol+`</div>
                <div>`+coin.name+`</div>
                    <label class="switch">
                    <input type="checkbox" class="save-coin" `+checked+` data-id="`+coin.id+`">
                    <span class="slider round"></span>
                    </label>
                <div class="info" style="display:none"></div>
                <button class="more-info" data-id="`+coin.id+`">more info</button>
            </div>
        </div>
    </div>`;
}

function loadingTemplate() {
    return `<div class="lds-ripple"><div></div><div></div><div></div></div>`;
}

//initializing events on elementes of coin card
function activateTriggersOnCoinCard() {
    $(".coin-card").not(".inited").find(".save-coin").click(function() {
        let id=$(this).data("id")
        
        let key = savedCoins.indexOf(id);
        if (key > -1) {
            savedCoins.splice(key,1);
        }
        else if (savedCoins.length < 5) {
            
            savedCoins.push(id);
        }
        else {
            myModal.show();

            $("#savedCoinsModalContent").html("<div>You can save up to 5 coins. Please uncheck one of the coins</div><div class='row'></div>");

            $.each(savedCoins,function(i, coinId) {

                getCoinInfo(coinId, function(coin){
                    $("#savedCoinsModalContent .row").append(coinCardTemplate(coin));
                    activateTriggersOnCoinCard();
                });
            })
        }
        localStorage.setItem("savedCoins",JSON.stringify(savedCoins));
      })

      $(".coin-card").not(".inited").find(".more-info").click(function () {
        let btn=$(this);
        let infoDiv=btn.parent().find(".info");
        if (infoDiv.is(":visible")) {
            infoDiv.slideUp();
        }
        else{
               
                let id=$(this).data("id");
               
                infoDiv.html(loadingTemplate());

                let json = getCoinInfo(id, function(json){
                    let html = `
                    <div><img src="`+json.image.thumb+`"></div>
                    <div>`+json.market_data.current_price.ils+`₪</div>
                    <div>`+json.market_data.current_price.usd+`$</div>
                    <div>`+json.market_data.current_price.eur+`€</div>
                    `;

                    infoDiv.html(html);
                    infoDiv.slideDown();
                })
                
           
        }
    });
    $(".coin-card").addClass("inited")

}

//get data from Crypto Api and print to html 
function printCoins(search) {

    let html=""

    $("#content").html(loadingTemplate());

    $.getJSON("https://api.coingecko.com/api/v3/coins/list",function(json) {
        html+=`<div class="container">`
            html+=`<div class="row">`

            if (search) {
                json=json.filter(function(coin){
                    return (coin.name.toLowerCase().indexOf(search.toLowerCase())>-1) ||
                    (coin.symbol.toLowerCase().indexOf(search.toLowerCase())>-1);         
                });
            }

            $.each(json,function(i, coin) {
                html+=coinCardTemplate(coin)
                console.log(i);
                if (i>=100) {
                    return false;
                }
            });
            html+=`</div>`
        html+=`</div>`

        $("#content").html(html) ;

        activateTriggersOnCoinCard();
    })
}
// get array from localstorage of saved coins 
function getSavedCoins() {
    let savedCoins=localStorage.getItem("savedCoins")
    if (!savedCoins) {
        return []
    }
    return JSON.parse(savedCoins)
}
// check if coin exists in the saved coins and returns boolean
function isCoinChecked(id) {
    let savedCoins = getSavedCoins();
    let checked = false;
    $.each(savedCoins, function(i, coinId) {
        if (coinId == id) {
            checked = true;
        }
    });
    return checked;
}

//get id of coin,fetching data from the Api and triggers callbeack functhion
function getCoinInfo(id, callback) {
    let getSavedCoinData=getLocalStorageWithExpiry(id)
    if (getSavedCoinData) {
        callback(getSavedCoinData)
    }
    else{
        $.getJSON("https://api.coingecko.com/api/v3/coins/"+id,function(json){
            setLocalStorageWithExpiry(id, json,(1000*60*2));
            callback(json);
        });
    }
}
//extend set localstorage by adding experation time
function setLocalStorageWithExpiry(key, value, ttl) {
	const now = new Date()

	const item = {
		value: value,
		expiry: now.getTime() + ttl,
	}
	localStorage.setItem(key, JSON.stringify(item))
}

//extend  get localstorage, get item value only if not expired
function getLocalStorageWithExpiry(key) {
	const itemStr = localStorage.getItem(key)
	if (!itemStr) {
		return null
	}
	const item = JSON.parse(itemStr)
	const now = new Date()
	// compare the expiry time of the item with the current time
	if (now.getTime() > item.expiry) {
		// If the item is expired, delete the item from storage
		// and return null
		localStorage.removeItem(key)
		return null
	}
	return item.value
}
// init search
$("#searchBtn").click(function() {
    let search= $("#search").val()
    printCoins(search);

})

printCoins();


