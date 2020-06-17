//$(window).on('load', function (e){
$(document).ready(function(){
	$('html').removeClass('no-js');

	//Yes, browser detection. Feature detection won't help with browser specific styling.
	if($.browser.mozilla){$('body').addClass('mozilla');}
	if($.browser.chrome){$('body').addClass('chrome');}
	if($.browser.webkit){$('body').addClass('webkit');}
	if($.browser.msie){$('body').addClass('msie legacy');}
	if($.browser.msedge){$('body').addClass('msie edge');}

	//orientation
	if(window.orientation === -90 || window.orientation === 90){$('body').addClass('landscape');}
	else{$('body').addClass('portrait');}

		//resizing and orientation watches and triggers
	var resizeWatcher;
	$(window).resize(function() {
		clearTimeout(resizeWatcher);
		resizeWatcher = setTimeout(doneResizing, 100);
	});
	function doneResizing(){init();}
	function doOnOrientationChange(){
		if(window.orientation === -90 || window.orientation === 90){$('body').addClass('landscape').removeClass('portrait');}
		else{$('body').removeClass('landscape').addClass('portrait');}
		init();
	}


	//start everything rolling on page load.
	init();

	function init(){
		//Only initialize resizable items in this block
		//Utility classes and size tests for breakpoints.
		if($(window).width() < 999 && $(window).width() > 600){
            $('body').removeClass('mobile').removeClass('desktop').addClass('tab');
        }
		else if($(window).width() < 575 || jQuery.browser.mobile === true){
			$('body').removeClass('tab').removeClass('desktop').addClass('mobile');
		}
		else{
			//reset mobile stuff if we are on desktop
            $('body').removeClass('mobile').removeClass('tab').addClass('desktop');
        }
        //setHeaderOffset()
    }

    //hamburger
    $("header a.hamburger").on("click", this, function(e){
        $(this).toggleClass("active")
        $($(this).attr("href")).toggleClass("active")
        e.preventDefault()
    })

    //go to named anchor/id
    $('a.scrollToTarget').on('click', this , function(e){
        $el = $($(this).attr("href"));
        console.log("scrolling to")
		$('html, body').animate({
            scrollTop: $el.offset().top
        }, 2000);
		e.preventDefault();
    });



    //modals
    $(".modaltrigger").on("click", function(e){
        $(".modal.active").removeClass("active")
        var el ="";
        if($(this).attr("href")){
            el = $(this).attr("href")
        }
        else{
            el = $(this).find("a").attr("href")
        }
        showModal(el);
        e.preventDefault();
    })
    $("#overlay").on("click", function(e){
         hideModal();
    })

    $(".closeModal").on("click",function(e){
        hideModal()
        e.preventDefault();
    })

    //sticky header
    /* var h = $("header").outerHeight();
    function setHeaderOffset(){
        $("main").css({"padding-top": h})
    }
    setHeaderOffset()
    $(document).on("scroll", function(){
      if($(document).scrollTop() > h){
        $("header").addClass("shrink");
        $("body").addClass("sticky")
      }
      else{
        $("header").removeClass("shrink");
        $("body").removeClass("sticky")
      }
    }); */

    //tab panels
    $(".tabpanel").each(function(i,e){
        $tabpanel =  $(this);
        $tabpanel.prepend('<nav class="tabnav"><ul></ul></nav>');
        $tabpanel.find(".tab").each(function(i,e){
            $tabpanel.find(".tabnav ul").append('<li><a href="#'+$(this).attr("id")+'">'+$(this).attr("data-title")+'</a></li>')
        })
    })
    $(".tabpanel .tabnav ul li:first-child a, .tabpanel .tabholder .tab:first-child .tabBody").addClass("active");

    $(".tabpanel").on("click", "nav a", function(e){
        var $thisTab = $(this).parents(".tabpanel");
        var $target = $($(this).attr("href")).find(".tabBody");
        $thisTab.find("nav a.active, .tabBody.active").removeClass("active");
        $(this).addClass("active");
        $target.addClass("active");
        setTab();
        e.preventDefault();
        return false;
    });
    function setTab(){
        var activeHeight = $(".tabBody.active").innerHeight() + $(".tabpanel nav").innerHeight() + parseInt($(".tabpanel nav").css("margin-bottom"));
        $(".tabpanel").css({"height": activeHeight});
    }

    //accordions
    $(".accordionheader").on("click", this, function(e){
        //$(".accordionheader.active").removeClass("active");
        $(".accordioncontentholder").attr("style","");
        var $a = $(this).next(".accordioncontentholder");
        if($(this).hasClass("active")){
            $a.css({"height":0})
            $(this).removeClass("active");
        }
        else{
            $a.css({"height":$a.find(".accordioncontent").innerHeight()})
            $(this).addClass("active")
        }
    });

    //wrap cms content in markup
    $('.container :not(script, sup)').contents().filter(function() {
        //wrap all reg and copy marks in sup tags.
        return this.nodeType === 3;
    }).replaceWith(function() {
        return this.nodeValue.replace(/(\w+[ ]*)(®|©)/gi, '<span class="nb">$1<sup>$2</sup></span>');
    });
    $('.container :not(script, sup)').contents().filter(function() {
        //wrap all tm in span tags.
        return this.nodeType === 3;
    }).replaceWith(function() {
        return this.nodeValue.replace(/(\w+[ ]*)(™)/g, '<span class="nb">$1<span class="tm">$2</span></span>');
    });

    //img uploader
    $('input[type="file"].img').on("change", this, function(){
        var display = $(this).val().replace("C:\\fakepath\\", "");
        var $p = $(this).parents(".imageuploader");
        if($(this).val() !==""){
            $p.addClass("active");
            $p.find(".uploadFileText").html("Uploading: " + display)
            readURL(this, $p);

        }
    })
    $(".cancelimage").on("click", this, function(e){
        var $p = $(this).parents(".imageuploader");
        $p.removeClass("active");
        $p.find("input").val("");
        $p.find('.imgpreview').removeClass("active");
        $p.find('.preview').attr("src","").removeClass("active");
        e.preventDefault();
    })
    function readURL(input, $p) {
        if (input.files &&input.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
                $p.find('.preview').attr('src', e.target.result);
                $p.find('.imgpreview').addClass("active");
            }
            reader.readAsDataURL(input.files[0]);
        }
    }

    //share widget
    /* FB.getLoginStatus(function(response) {
        if (response.status === 'connected') {
        }
    }); */
    $(".socialshareicons.default, .sociallinks").on("click", "a", function(e){
        if($(this).hasClass("fb")){
            var domain = window.location.hostname;
            FB.ui({
              method: 'share',
              display: 'iframe',
              href: window.location.href,
            }, function (response) {

            });
            e.preventDefault()
        }
    });

    $(".socialshareicons.custom").on("click", "a", function(e){
        var domain = window.location.hostname;
        var sharePage;
        var shareText;
        var shareTitle;
        var shareimg;
        if($(this).hasClass("fb")){

            FB.ui({
              method: 'share',
              href: domain + '/share/'+sharePage+"/"+shareTitle+"/"+shareText+"/"+shareimg,
            }, function (response) {

            });
        }
        if($(this).hasClass("tw")){

        }
        e.preventDefault();
    });

    //form validation
    $("form.validate").on("blur", ".textbox.req input", function(e){
        var p = $(this).parents("label")
        p.removeClass("focused")
				$('.e').find(".errMsg").remove()
        p.find(".errMsg").remove()
        if($(this).val() ==""){
            p.addClass("error")
            p.append('<span class="errMsg">This field is required</span>')
        }
        else{
            p.removeClass("error")
        }
    })
    .on("focus", "input[type='text']", function(e){
        $(this).parents("label").not(".fullwidth").addClass("focused")
    })
    .on("submit", this, function(e){
        $("label.error,.ee.error").removeClass("error")
        $(".errMsg").remove();
        $(this).find("label.req").each(function(i, e){
            var input = $(this).find("input");
            if(input.attr("type") == "text" && input.val() ==""){
                $(this).addClass("error")
                $(this).append('<span class="errMsg">This field is required</span>')
            }
						if(input.attr("type") == "password" && input.val() ==""){
                $(this).addClass("error")
                $(this).append('<span class="errMsg">This field is required</span>')
            }
						if(input.attr("type") == "password"){
								if($('#password').val()!=$('#password2').val()){
									$('.e2').addClass("error")
	                $('.e2').html('<span class="errMsg">Passwords do not match</span>')
								}
            }
            if(input.attr("type") == "checkbox" && !input.is(":checked")){
                $(this).addClass("error")
                $(this).append('<span class="errMsg">This field is required</span>')
            }
            if(input.hasClass("email")){
                if(!input.val() =="" && !validateEmail(input.val())){
                    $(this).addClass("error")
                    $(this).append('<span class="errMsg">Please enter a valid email</span>')
                }
            }
        })
				if($('label.team_radios').length>0){
					var radio_count = 0;
					$(this).find(".team_radios").each(function(i, e){
						var input = $(this).find("input");
						if($(input).is(':checked')){
							radio_count++;
						}
					})
					if(radio_count==0){
						$('.e3').addClass("error")
						$('.e3').append('<span class="errMsg">Please choose how many memembers on your team</span>')
					}
				}
				if($('label.cooknumber_val').length>0){
					var count = 0;
					$(this).find("label.cooknumber_val").each(function(i, e){
						var input = $(this).find("input");
						if(input.val()==''){
							count++;
						}
					})
					if(count==6){
						$('.e').addClass("error")
						$('.e').append('<span class="errMsg">Please add at least one ID from an official sanctioning body</span>')
					}
				}
        if($("label.error").length > 0){
            var $t =  $("label.error").eq(0).offset().top
            $("html, body").animate({
                scrollTop: $t
            }, 1000);
            $("label.error").eq(0).focus()
            return false
        }
        else if($(".ee.error").length > 0){
                var $t =  $(".ee.error").eq(0).offset().top-80
                $("html, body").animate({
                        scrollTop: $t
                }, 1000);
                return false
        }
        else{
            if($(this).hasClass("pp")){
                showModal($("#loading"))
                // $.ajax({
                //         type: "POST",
                //         url: '/committed-cooks-application',
                //         data: $("form.pp").serializeArray(),
                //         cache: false,
                //         dataType:"json",
                //         success: function(data){
                //            paypalFunction(data.success[0])
                //         },
                //         done: function(data){
                          
                //         },
                //         error:function(error){
                //             alert("There was a problem with your submission, please try again.");
                //             console.log(error)
                //         }
                //       })
                paypalFunction();
                return false
            }
            else{
                return true
            }
        }
    });
    $('.phone input').mask('(000) 000-0000');
    $('.state input').mask('AA');
    $(".zip input").mask('00000-0000')


    function validateEmail(email) {
        var re = /[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
        if (re.test(email)) {
            return true;
        } else {
            return false;
        }
    }

    //homepage stuff
    $(".homepage .pin").each(function(i,e){
        let w = $(this).parents(".map").width() / 3;
        let p = $(this).position();
        if(p.left< w){
            $(this).addClass("left")
        }
        else if(p.left< w*2){
            $(this).addClass("center")
        }
        else{$(this).addClass("right")}
    })
    $(".homepage").on("click", ".map .pin", function(e){
        $(".pin.active").removeClass("active")
        $(this).addClass("active")
        e.preventDefault()
    })
    .on("click", this, function(e){
        if($(e.target).parents(".pin").length == 0){
            $(".pin.active").removeClass("active")
        }

    })

    //committed cooks stuff
    $("a.closeForm").on("click", this, function(e){
        var $t = $($(this).attr("href"));
        $t.slideUp();
        e.preventDefault();
    });
    $("a.openform").on("click", this, function(e){
        var $t = $($(this).attr("href"));
        $t.slideDown();
        $("html, body").animate({
            scrollTop: $t.offset().top }, 1000
        );
        e.preventDefault();
    });
    $(".othersanction").on("change", "input", function(e){
        if($(this).is(":checked")){
            $(".sanctioning_body-othertext").css({"display":"flex"})
        }
        else{
            $(".sanctioning_body-othertext").css({"display":"none"})
        }
    })
    $(".foodservice").on("change", "input[type='radio']", function(e){
        if($(this).is(":checked") && $(this).val() == "yes"){
            $(".foodservice .info").css({"display":"block"})
        }
        else{
            $(".foodservice .info").css({"display":"none"})
        }
    })
    $(".teamMembers").on("change", "input[type='radio']", function(e){
        if($(this).is(":checked") && $(this).val()=="6+"){
            $(".extramembers").css({"display":"inline-block"})
        }
        else{
            $(".extramembers").find("input").val("")
            $(".extramembers").css({"display":"none"})
        }
    })
    $("a.lightbox").on("click", this, function(e){
        $(".modal.lightbox").find("img").attr("src",$(this).attr("href"))
        showModal($("#lightbox"))
        e.preventDefault();
    });


    //slider
    if($(".slider").length >0){
        $(".slider").each(function(i,e){
            //initialises slider(s)
            let slider = $(this);
            setSlide(slider);
            slider.append('<nav><a href="#prev" class="prev">previous</a><ul></ul><a href="#next" class="next">next</a></nav>')
            slider.append('<a href="#prev" class="arrows prev">previous</a><a href="#next" class="arrows next">next</a>')
            slider.find(".slide").each(function(i,e){
                $(this).attr("id","slide"+i).attr("data-slide", i)
                slider.find("nav ul").append('<li><a href="#slide'+i+'" data-target="'+i+'">'+i+'</a></li>')
            })

            slider.find(".slide").eq(0).addClass("currentSlide")
            slider.find("nav ul li a").eq(0).addClass("currentSlide")
            slider.attr("data-current",0)
            slider.attr("data-slides", slider.find(".slide").length)

            slider.on("click", "nav a, a.arrows", function(e){
                $("nav a.currentSlide, .slide").removeClass("currentSlide")
                if($(this).hasClass("next")){
                    nextSlide(slider)
                }
                else if($(this).hasClass("prev")){
                    prevSlide(slider)
                }
                else{
                    gotoSlide($(this), slider)
                }
                e.preventDefault();
            })
        })
        $(window).resize(function() {
            $(".slider").each(function(i,e){
                setSlide($(this));
            })
        })
    }
    function setSlide(slider){
        //sets sizes for slider and slides.
        slider.removeClass("active")
        let w = slider.width()
        let h="";
        slider.find(".slide,.slidesholder").attr("style","")
        slider.find(".slide").each(function(i,e){ if($(this).height() > h){h = $(this).height()}})
        let numOfSlides = slider.find(".slide").length
        let holderwidth = w * numOfSlides
        $(".slide").css({"width":w,"height":h})
        slider.find('.slidesholder').css({"width":holderwidth, "height":h})
        slider.addClass("active")
    }
    function nextSlide(slider){
        let w = slider.width()
        slider.find(".slidesholder").animate({
            'margin-left':w*-1
        }, 500, function(){
            slider.find(".slidesholder").css({'margin-left':0})
            slider.find(".slide:first").appendTo(slider.find(".slidesholder"));
            slider.find("nav li a").eq(slider.find(".slide:first").attr("data-slide")).addClass("currentSlide")
            slider.find(".slide:first").addClass("currentSlide")
            slider.attr("data-current",slider.find(".slide:first").attr("data-slide"))
        })

    }
    function prevSlide(slider){
        let w = slider.width()
        slider.find(".slidesholder").css({'margin-left':w*-1})
        slider.find(".slide:last").prependTo(slider.find(".slidesholder"));
        slider.find(".slidesholder").animate({
            'margin-left':0
        }, 500, function(){
            slider.find("nav li a").eq(slider.find(".slide:first").attr("data-slide")).addClass("currentSlide")
            slider.find(".slide:first").addClass("currentSlide")
            slider.attr("data-current",slider.find(".slide:first").attr("data-slide"))
        })
    }
    function gotoSlide(slide, slider){
        let target= $(slide.attr("href")).position()
        slider.find(".slidesholder").animate({
            'margin-left':target.left *-1
        }, 500, function(){
            slider.find(".slidesholder .slide").slice(0, $(slide.attr("href")).index()).appendTo(slider.find(".slidesholder"))
            slider.find(".slidesholder").css({"margin-left":0})
            slider.find(".slide:first").addClass("currentSlide")
            slider.find("nav li a").eq(slider.find(".slide:first").attr("data-slide")).addClass("currentSlide")
            slider.attr("data-current",slider.find(".slide:first").attr("data-slide"))
        })
    }
    $('.datepicker, .datepicker input').pikaday({ firstDay: 1, format: 'D MMM YYYY',});

    //contact
    $("form.contact").on("submit", this, function(e){
        if($(this).hasClass("ajax")){
            $.ajax({
                type: "POST",
                url: '/contact',
                dataType: "json",
                cache: false,
                data: $(this).serialize(),
                success: function(data){
                  $(".contact .formholder").slideUp()
                  $(".contact .successMsg").html('<h1>Thanks!</h1>')
                  $(".contact input[type='text'], .contact textarea").val("")
                },
                done: function(data){

                },
                error:function(error){
                  console.log(error)
                }
              })
            return false
        }
    })
    $("form.contact.ajax").parents(".modal").on("click", "a.closeModal", function(e){
        $(".contact .successMsg").empty()
        $(".contact .formholder").css({"display":"block"})
    });


});
function showModal(el){
    var s = $("body, html").scrollTop()
    $("#overlay").addClass("active")
    $(el).addClass("active");
    $("body, html").addClass("modalActive")
    $(".container").attr("data-top", s).css({"margin-top":s*-1});
}
function hideModal(){
    var s = $(".container").attr("data-top")
    $("#overlay").removeClass("active");
    $("body,html").removeClass("modalActive")
    $(".modal.active").removeClass("active");
    $(".container").css({"margin-top":"0"});
    $("body, html").scrollTop(s);
}

function logMsg(msg){window.console && console.log(msg);}
/*!
* jQuery Browser Plugin 0.1.0
* https://github.com/gabceb/jquery-browser-plugin
*
* Original jquery-browser code Copyright 2005, 2015 jQuery Foundation, Inc. and other contributors
* http://jquery.org/license
*
* Modifications Copyright 2015 Gabriel Cebrian
* https://github.com/gabceb
*
* Released under the MIT license
*
* Date: 23-11-2015
*/
!function(a){"function"==typeof define&&define.amd?define(["jquery"],function(b){return a(b)}):"object"==typeof module&&"object"==typeof module.exports?module.exports=a(require("jquery")):a(window.jQuery)}(function(a){"use strict";function b(a){void 0===a&&(a=window.navigator.userAgent),a=a.toLowerCase();var b=/(edge)\/([\w.]+)/.exec(a)||/(opr)[\/]([\w.]+)/.exec(a)||/(chrome)[ \/]([\w.]+)/.exec(a)||/(iemobile)[\/]([\w.]+)/.exec(a)||/(version)(applewebkit)[ \/]([\w.]+).*(safari)[ \/]([\w.]+)/.exec(a)||/(webkit)[ \/]([\w.]+).*(version)[ \/]([\w.]+).*(safari)[ \/]([\w.]+)/.exec(a)||/(webkit)[ \/]([\w.]+)/.exec(a)||/(opera)(?:.*version|)[ \/]([\w.]+)/.exec(a)||/(msie) ([\w.]+)/.exec(a)||a.indexOf("trident")>=0&&/(rv)(?::| )([\w.]+)/.exec(a)||a.indexOf("compatible")<0&&/(mozilla)(?:.*? rv:([\w.]+)|)/.exec(a)||[],c=/(ipad)/.exec(a)||/(ipod)/.exec(a)||/(windows phone)/.exec(a)||/(iphone)/.exec(a)||/(kindle)/.exec(a)||/(silk)/.exec(a)||/(android)/.exec(a)||/(win)/.exec(a)||/(mac)/.exec(a)||/(linux)/.exec(a)||/(cros)/.exec(a)||/(playbook)/.exec(a)||/(bb)/.exec(a)||/(blackberry)/.exec(a)||[],d={},e={browser:b[5]||b[3]||b[1]||"",version:b[2]||b[4]||"0",versionNumber:b[4]||b[2]||"0",platform:c[0]||""};if(e.browser&&(d[e.browser]=!0,d.version=e.version,d.versionNumber=parseInt(e.versionNumber,10)),e.platform&&(d[e.platform]=!0),(d.android||d.bb||d.blackberry||d.ipad||d.iphone||d.ipod||d.kindle||d.playbook||d.silk||d["windows phone"])&&(d.mobile=!0),(d.cros||d.mac||d.linux||d.win)&&(d.desktop=!0),(d.chrome||d.opr||d.safari)&&(d.webkit=!0),d.rv||d.iemobile){var f="msie";e.browser=f,d[f]=!0}if(d.edge){delete d.edge;var g="msedge";e.browser=g,d[g]=!0}if(d.safari&&d.blackberry){var h="blackberry";e.browser=h,d[h]=!0}if(d.safari&&d.playbook){var i="playbook";e.browser=i,d[i]=!0}if(d.bb){var j="blackberry";e.browser=j,d[j]=!0}if(d.opr){var k="opera";e.browser=k,d[k]=!0}if(d.safari&&d.android){var l="android";e.browser=l,d[l]=!0}if(d.safari&&d.kindle){var m="kindle";e.browser=m,d[m]=!0}if(d.safari&&d.silk){var n="silk";e.browser=n,d[n]=!0}return d.name=e.browser,d.platform=e.platform,d}return window.jQBrowser=b(window.navigator.userAgent),window.jQBrowser.uaMatch=b,a&&(a.browser=window.jQBrowser),window.jQBrowser});



var metas = document.getElementsByTagName('meta');
var i;
if (navigator.userAgent.match(/iPad/i)) {
	for (i=0; i<metas.length; i++) {
	if (metas[i].name == "viewport") {
		metas[i].content = "width=device-width, minimum-scale=1.0, maximum-scale=1.0";
	}
	}
	document.addEventListener("gesturestart", gestureStart, false);
}
function gestureStart() {
	for (i=0; i<metas.length; i++) {
	if (metas[i].name == "viewport") {
		metas[i].content = "width=device-width, minimum-scale=0.25, maximum-scale=1.6";
	}
	}
}
