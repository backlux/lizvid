

var uid=0;
var item_id=0;
var usd_money=0;

function get_url_prefix(){

  return document.location.protocol+"//"+location.host;
}

function getParam(paramName) { 
    paramValue = "", isFound = !1; 
    if (this.location.search.indexOf("?") == 0 && this.location.search.indexOf("=") > 1) { 
        arrSource = unescape(this.location.search).substring(1, this.location.search.length).split("&"), i = 0; 
        while (i < arrSource.length && !isFound) arrSource[i].indexOf("=") > 0 && arrSource[i].split("=")[0].toLowerCase() == paramName.toLowerCase() && (paramValue = arrSource[i].split("=")[1], isFound = !0), i++ 
    } 
    return paramValue == "" && (paramValue = null), paramValue 
}  


function open_pay_option(user_id,item_id_,usd){

  uid= parseInt(user_id); //这两个在数据库都是int
  item_id = parseInt(item_id_);
  usd_money = usd;// 乘过100的，这里即使被修复了也没事，后台会按item扣，可以模拟一下

  var pay_option = document.getElementById('pay-option');
  pay_option.style.display = "";


}

function  close_pay_option() {

  var pay_option = document.getElementById('pay-option');
  pay_option.style.display = "none";
}



// Create a Stripe client.
var stripe = Stripe('pk_live_HBXLQCBuYJPIoHD8vqlan7jc');//


//ajax_method(url,,"post",func)
function ajax_method(url,data,method,success) {
    // 异步对象
    var ajax = new XMLHttpRequest();
    console.log("ajax_method 发送 data "+JSON.stringify(data));

    // get 跟post  需要分别写不同的代码
    if (method=='get') {
        // get请求
        if (data) {
            // 如果有值
            url+='?';
            url+=data;
        }else{

        }
        // 设置 方法 以及 url
        ajax.open(method,url);

        // send即可
        ajax.send();
    }else{
        // post请求
        // post请求 url 是不需要改变
        ajax.open(method,url);

        // 需要设置请求报文
        ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");

        // 判断data send发送数据
        if (data) {
            // 如果有值 从send发送
            ajax.send(data);
        }else{
            // 木有值 直接发送即可
            ajax.send();
        }
    }

    // 注册事件
    ajax.onreadystatechange = function () {
        // 在事件中 获取数据 并修改界面显示
        if (ajax.readyState==4&&ajax.status==200) {
            console.log(ajax.responseText);

            // 将 数据 让 外面可以使用
            // return ajax.responseText;

            // 当 onreadystatechange 调用时 说明 数据回来了
            // ajax.responseText;

            // 如果说 外面可以传入一个 function 作为参数 success
            success(ajax.responseText);
        }
    }
}

//Stripe.js其实就是客户端的一个JS核心类库，Elements是它的UI类库
//card-------------------------
// Create an instance of Elements.
var elements = stripe.elements();

// Custom styling can be passed to options when creating an Element.
// (Note that this demo uses a wider set of styles than the guide below.)
//如果属性有'-'号，就写成驼峰的形式（如textAlign）  如果想保留 - 号，就中括号的形式 

    //lineHeight: '8vw',
    //height:
    //fontSize: '3vw',
var style = {
  base: {
    color: '#32325d',
    fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
    fontSmoothing: 'antialiased',
    textAlign: 'center',
    fontSize: '3vw',
    '::placeholder': {
      color: '#aab7c4',
      fontSize: '3vw'
    }
  },
  invalid: {
    color: '#fa755a',
    iconColor: '#fa755a'
  }
};

// Create an instance of the card Element.
var card = elements.create('card', {style: style});

// Add an instance of the card Element into the `card-element` <div>.
card.mount('#card-element');

// Handle real-time validation errors from the card Element.
card.addEventListener('change', function(event) {
  var displayError = document.getElementById('card-errors');
  if (event.error) {
    displayError.textContent = event.error.message;
  } else {
    displayError.textContent = '';
  }
});

// Handle form submission.
var form = document.getElementById('payment-form');
form.addEventListener('submit', function(event) {
  event.preventDefault();
  //没法直接取，封装的太厉害了，直接拿result是怕被平台监控到不行，但是js其实也调用了stripe的网站了 到时候实在不行自己写个页面
  //console.log("card ++ "+JSON.stringify(card));

  
  stripe.createToken(card).then(function(result) {
    if (result.error) {
      // Inform the user if there was an error.
      var errorElement = document.getElementById('card-errors');
      errorElement.textContent = result.error.message;
    } else {
    	//打印出来返回数据
    	console.log("result ++ "+JSON.stringify(result));
      // Send the token to your server.
      

      //申请付款charge 使用itemID来charge
      var currency ="usd"; //这个是固定的，帐号的归属地决定的

      var postData = "cmd=charge&itemID="+item_id+"&currency="+currency+"&stripeToken="+result.token.id+"&uid="+uid;
      ajax_method(get_url_prefix()+"/store/api/luxpay.php",postData,"post",chargeResult);

      //之后等待服务器确认
      waiting();
    }
  });
   
});


function chargeResult(result){

  console.log("服务器luxpay 返回数据 ++ "+result);

  var res = JSON.parse(result);
  if(res.status ==1){
    console.log("提示支付成功");
    window.location.href =get_url_prefix()+"/store/index.php?uid="+uid;
  }
  else{
    console.log("提示支付出错，请重试");
    hideWaiting();
    alert("支付失败，请检查卡信息是否正确");

  }

	
}

//---------------------------- stripejs版本的 alipay
//currency 必须是Stripe账号所在地货币，也就是绑定的银行卡所在地 要提示玩家可以自动转换汇率

/*

跳转到app的方法

To integrate Alipay within a mobile application, provide your application URI scheme as the redirect[return_url] value. By doing so, your customers are returned to your app after completing authorization. Direct redirects to the Alipay app are also supported when using our native SDKs. Refer to our Sources API documentation for iOS or Android to learn more.

For Android sources, the Alipay SDK is required for app-to-app support.

*/

function alipay(amount) {
    //showLoading();
    stripe.createSource({
        type: 'alipay',
        amount: parseInt(amount),
        currency: 'usd', // usd, eur,
        metadata:{
          userID: uid,
          itemID:item_id
        },
        redirect: {
            return_url: get_url_prefix()+'/store/index.php?uid='+uid
            //return_url指向的是当用户重定向到我们常见的支付宝支付页面后，跳转回支付完成的页面，在这个返回页面中，因为支付宝是同步完成支付的，
            //所以我们可以去查询charge.succeeded的状态来判定是否用户支付是否完成。

            //Stripe populates the redirect[return_url] with the following GET parameters when returning your customer to your website:

            //source: a string representing the original ID of the Source object
            //livemode: indicates if this is a live payment, either true or false
            //client_secret: used to confirm that the returning customer is the same one who triggered the creation of the source (source IDs are not considered secret)

        },
    }).then(function (response) {
        //hideLoading();
        if (response.error) {
            alert(response.error.message);
        }
        else {
            processStripeResponse(response.source);
        }
    });
}
function processStripeResponse(source) {
  //source 创建成功之后，会是pending的状态，redirect 到 stripe的网关，再跳转到alipay 等待用户支付
  //source 需要上传服务器，用用户id 和 itemid建立关联
  //2. 后面发现souce 可以有 payload  metadata！这样服务器就不需要关联了
 

  //var ajax_url = get_url_prefix()+"/store/api/luxpay.php";

  //console.log("stripe返回的待跳转 source id "+JSON.stringify(source));
  //console.log("stripe返回的待跳转 ajax_url "+ajax_url);

  //var postData = "cmd=sourceRecord&itemID="+itemID+"&uid="+uid+"&sourceID="+source.id+"&nextURL="+source.redirect.url;
  //ajax_method(ajax_url,postData,"post",sourceRecorded);

  //这个是跳转到 stripe的网关。
  window.location.href = source.redirect.url;

}



document.getElementById('alipayButton').addEventListener('click', function(e) {
  // Open Checkout with further options:
  alipay(usd_money);
  e.preventDefault();
});


// ------------------------- payment req button
console.log("paymentRequest generate");

var paymentRequest = stripe.paymentRequest({
  country: 'US',
  currency: 'usd',
  total: {
    label: 'Demo total',
    amount: 1000,
  },
  requestPayerName: true,
  requestPayerEmail: true,
});


var prButton = elements.create('paymentRequestButton', {
  paymentRequest: paymentRequest,
});

console.log("prButton generate");

// Check the availability of the Payment Request API first.
paymentRequest.canMakePayment().then(function(result) {
  if (result) {
    prButton.mount('#payment-request-button');
  } else {
  	console.log("不支持 paymentReq按钮");
    document.getElementById('payment-request-button').style.display = 'none';
  }
});

//Complete the payment using the emitted token
paymentRequest.on('token', function(ev) {
  // Send the token to your server to charge it!
  fetch('/charges', {
    method: 'POST',
    body: JSON.stringify({token: ev.token.id}),
    headers: {'content-type': 'application/json'},
  })
  .then(function(response) {
    if (response.ok) {
      // Report to the browser that the payment was successful, prompting
      // it to close the browser payment interface.
      ev.complete('success');
    } else {
      // Report to the browser that the payment failed, prompting it to
      // re-show the payment interface, or show an error message and close
      // the payment interface.
      ev.complete('fail');
    }
  });
});


console.log("-------- checkout js 部分");

//自定义的checkout界面

/**

	  <script
	    src="https://checkout.stripe.com/checkout.js" class="stripe-button"
	    data-key="pk_test_30T02j3eKZMXTQCu6RLW92I2"
		data-amount="999"
	    data-name="Online Game"
	    data-description="Pack of gems"
	    data-zip-code="true"
	    data-image="https://stripe.com/img/documentation/checkout/marketplace.png"
	    data-locale="auto">
	  </script>

	  The amount (in cents) that's shown to the user. Note that you will still have to explicitly include the amount when you create a charge using the API. 
	  (You will also need to provide Checkout with a data-currency value to change the default of USD.) 

	  */

//https://stripe.com/docs/checkout#integration-custom
//name desc 这些需要自己翻译哈
//Stripe不再提供alipay的checkout方式， 只支持elements
/*
var handler = StripeCheckout.configure({
  key: 'pk_test_30T02j3eKZMXTQCu6RLW92I2',
  image: 'https://stripe.com/img/documentation/checkout/marketplace.png',
  locale: 'auto',
  zipCode : true,
  billingAddress:true,
  allowRememberMe: true,
  alipay: true,  
  token: function(token) {
    // You can access the token ID with `token.id`.
    // Get the token ID to your server-side code for use.
    $itemID = "testID";
    $currency ="usd";
    console.log("返回的 token.id "+token.id);
    var postData = "cmd=charge&itemID="+itemID+"&currency="+currency+"&stripeToken="+token.id;
    ajax_method("https://192.168.3.2/store/api/luxpay.php",postData,"post",chargeResult);
  }

});
 */
//如果这个被block，参考文档 https://stripe.com/docs/checkout#integration-custom
/*
document.getElementById('alipayButton').addEventListener('click', function(e) {
  // Open Checkout with further options:
  handler.open({
    name: 'Online Gaming',
    description: 'Gem pack',
    amount: 2000,
    currency: "usd"
  });
  e.preventDefault();
});

// Close Checkout on page navigation:
window.addEventListener('popstate', function() {
  handler.close();
});
*/


var activeSource= getParam("source");
var client_secret = getParam("client_secret");
var sourceIntv;

if(activeSource!=null){
    console.log("活跃source "+activeSource);
    //如果有活跃source 就显示旋转
    sourceIntv=window.setInterval("checkSource();",1000);//1秒检查一次
}
else{
   console.log("活跃source null");
}

//var cssIntv;// 修复css在安卓下面的显示问题
//cssIntv= window.setInterval("checkCss();",100);//1秒检查一次



//支付宝返回之后，无论成功还是失败都会返回 source 和sec
function checkSource() {

  console.log("检查source状态 activeSource "+activeSource+" client_secret "+client_secret);
  stripe.retrieveSource({
    id: activeSource,
    client_secret: client_secret,
  }).then(function(result) {
     if (result.error) {
          alert(result.error.message);
      }
      else {

        console.log("result Source "+JSON.stringify(result.source));

        if(result.source.status == "consumed"){
          //跳转刷新 不带参数
          //等待服务器刷新，大概1秒-2秒
          document.getElementById('waiting').style.display = 'block';
          setTimeout(function(){redirectTo(result.source.redirect.return_url);},2000); 
          
        }
        else if(result.source.status == "chargeable" || result.source.status == "pending" ){
          document.getElementById('waiting').style.display = 'block';
          console.log("等待支付网关确认");
        }
        else{
          console.log("source 错误 "+result.source.status);
          window.clearInterval(sourceIntv);
        }

      }
    // Handle result.error or result.source
  });
  // body...
}

function redirectTo(urlto){
  window.location.href = urlto;
}




function checkCss(){

  var test = document.getElementById('test');


  var cardElement = document.getElementById('card-element');
  var cardElementHeight = cardElement.offsetHeight; //style.height 不行。。。

  //test.innerText = "card 高度 "+cardElementHeight;

}

function waiting(){

  document.getElementById('waiting').style.display = 'block';
  console.log("等待服务器确认");
}

function hideWaiting() {
  document.getElementById('waiting').style.display = 'none';
}
