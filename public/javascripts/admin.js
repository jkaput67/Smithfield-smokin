$(window).ready(function(){
  if($(".customEditor textarea").length>0)
  {
    tinymce.init({
      selector: '.customEditor textarea',
      height: 500,
      menubar: false,
      plugins: [
        'advlist autolink lists link image charmap print preview anchor textcolor',
        'searchreplace visualblocks code fullscreen',
        'insertdatetime media table contextmenu paste code help wordcount'
      ],
      toolbar: 'insert | code | image | undo redo |  formatselect | bold italic backcolor  | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
      content_css: [
        '//fonts.googleapis.com/css?family=Lato:300,300i,400,400i',
        '/stylesheets/admin.css',
        '/stylesheets/style.css']
    });
  }
})

$(window).on('load', function (e){
  console.log("Admin Loaded");
  
  $(".showAdmin").on("click", this, function(e){
    $(".adminheader").toggleClass("active")
    e.preventDefault();
  })

  //normalize and check slug
  $(".pageslug").on("blur", "input", function(e){
    var $this = $(this);
    var slug = $(this).val().toLowerCase().replace(/ /g, "-").replace(/&/,"-and-").replace(/[!$%^*()_+|~=`{}\[\]:\/;<>?,.@#]/g, "");
    //check slug
    if(slug.length > 5){
      $.ajax({
        type: "POST",
        url: '/admin/check-slug/'+slug,
        success: function(data){
            $this.val(slug)
        },
        error:function(error){
          $this.val(slug + "-" + error.responseJSON.error)
        }
      })
    }
  })
  .on("click", "a.editslug", function(e){
    $(".pageslug input").css({"display":"block"})
    e.preventDefault();
  })

  $(".orderitems").on("click", this, function(e){
    var slug = $(this).attr('rel')
    var target = $($(this).attr("href")).find("ul.orderlist");
    target.attr("data-type", slug)
    $.ajax({
      type: "GET",
      url: '/admin/ajax/type-manager/get-children-order/'+slug,
      success: function(data){
        target.empty();
        data.success.forEach(e => {
          target.append(`<li rel="${e.cm_id}"><span class="handle">::</span>${e.title}</li>`)
        });
        $('.sortable').sortable({
          handle: '.handle'
        });
      },
      error:function(error){
        console.log(error)
      }
    })
  })

  $("#order .controls .button").on("click", this, function(e){
    var slug = $("#order .orderlist").attr('data-type');
    let order=[]
    $(".orderlist li").each(function(i,e){
      order.push($(this).attr("rel"))
    })
    $.ajax({
      type: "POST",
      data:JSON.stringify({ order: order }),
      dataType: "json",
      contentType: "application/json; charset=utf-8",
      url: '/admin/ajax/type-manager/set-children-order/'+slug,
      success: function(data){
        console.log(data)
        $("#overlay").removeClass("active");
        $("body").removeClass("modalActive");
        $(".modal.active").removeClass("active");
      },
      error:function(error){
        console.log(error)
      }
    })
    e.preventDefault();
  });
  



  $(".imgpath").on("click", ".addImg", function(e){
    var target = $(this).parents("label").find("input").attr("name")
    $("#overlay").addClass("active")
    $("#mediauploader").addClass("active").attr("data-target", target);
    $("body").addClass("modalActive");
    $.ajax({
      type: "GET",
      url: '/admin/ajax/media',
      dataType: "json",
      cache: false,
      success: function(data){
        var numberOfItems = data.allfiles.length
        console.log(data)
        for(i=0;i<numberOfItems;i++){
          $(".mediaholder .grid").prepend('<div class="item" data-url="'+data.allfiles[i].media_url+'"><span class="media_id">'+data.allfiles[i].media_id+'</span><img src="'+data.allfiles[i].media_url+'"/></div>')
        }
      },
      done: function(data){
        
      },
      error:function(error){
        console.log(error)
      }
    })
    e.preventDefault()
  })
  $(".preview").on("click", ".removeImg", function(e){
    $($(this).attr("href")).val("")    
    $(this).parents(".imgholder").find("img").attr("src","")
    $(this).parents(".preview").removeClass("active")
    e.preventDefault()
  })
  $("#mediauploader.modal").on("click",".closeModal", function(e){
    $(".mediaholder .grid").empty();
  }).on("click", ".grid .item", function(e){
    var target = $("#mediauploader").attr("data-target")
    var preview = $(".preview[rel='"+target+"']")
    var src = $(this).find("img").attr("src")
    $("input[name='"+target+"']").val(src)
    preview.find("img").attr("src", src)
    preview.addClass("active")
    $("#overlay").removeClass("active");
    $("body").removeClass("modalActive");
    $(".modal.active").removeClass("active");
  })
  if($('#fileupload').length>0){
    $('#fileupload').fileupload({
      dataType: 'json',
      dropZone: $('#dropzone'),
      add: function (e, data) {
        data.context = $('<a href="#upload"/>')
          .text('Upload ' + data.files[0].name)
          .appendTo("#fileinfo")
          .click(function (e) {
                data.context = $('<p/>').text('Uploading...').replaceAll($(this));
                data.submit()
                
                e.preventDefault()
          })
        
      },
      progress: function (e, data) {
        var progress = parseInt(data.loaded / data.total * 100, 10);
      },
      success: function(e, data){
        console.log(e)
        $(".mediaholder .grid").append('<div class="item"><img src="'+e.files+'"/></div>')
      },
      done: function (e, data) {
          /* $.each(data.result.files, function (index, file) {
              $('<p/>').text(file.name).appendTo(document.body);
          }); */
          data.context.text('Upload finished.').fadeOut();
      }
    });
  }


  
  //Template Manager
  $(".addtemplate").on("click", this, function(e){
    $("table#templates").append('<tr><td class="id"><span></span></td><td class="thelabel"><span></span><input type="text" name="newlabel" placeholder="Plain text label"></td><td class="slug"><span></span><input type="text" name="newslug" placeholder="filename"></td><td class="editcontrols"><a class="save" href="#save">save</a><a class="canceladd" href="#cancel">cancel</a></td></tr>')
    e.preventDefault();
  })
  $("table#templates")
    .on("click", "a.canceladd", function(e){
      $(this).parents("tr").remove();
      e.preventDefault();
    })
    .on("click", ".editcontrols a.edititem", function(e){
      var row = $(this).parents("tr");
      var thelabel = row.find(".thelabel").text()
      var theslug = $.trim(row.find(".slug").text());
      var theid = $.trim(row.find(".id").text());
      if(row.find("input").length==0){
        row.find("td.thelabel").append('<input type="text" name="newlabel" value="'+thelabel+'">')
        row.find("td.slug").append('<input type="text" name="newslug" value="'+theslug+'">')
        row.find(".edit.active").removeClass("active")
        row.find(".editing").addClass("active")
        row.addClass("editing")
      }
      e.preventDefault();
    })
    .on("click", ".editcontrols a.cancel", function(e){
      var row = $(this).parents("tr")
      row.find("input").remove()
      row.find(".edit").addClass("active")
      row.find(".editing.active").removeClass("active")
      row.removeClass("editing")
      e.preventDefault();
    })
    .on("click", ".editcontrols a.save", function(e){
      var row = $(this).parents("tr")
      var newLabel = row.find('.thelabel')
      var newSlug =  row.find('.slug')
      var id = row.find("td.id span")
      $.ajax({ 
        type: "POST",
        url: '/admin/ajax/template-manager',
        dataType: "json",
        data: {
          newlabel:$.trim(newLabel.find("input").val()), 
          newslug: $.trim(newSlug.find("input").val()),
          oldslug: $.trim(newSlug.find("span").text()),
          id: $.trim(id.text())
        },
        cache: false,
        success: function(data){
          console.log(data)
          row.removeClass("editing")
          row.find("input").remove()
          row.find(".edit").addClass("active")
          row.find(".editing.active").removeClass("active")
          newLabel.find("span").text(data.newlabel)
          newSlug.find("span").text(data.newslug)
          id.text(data.id)
          if(data.status == "new"){
            row.find(".editcontrols").empty().html(' <div class="edit active"><a class="edititem" href="/admin/template-manager/edit/2">Edit</a><a class="deleteitem" href="/admin/template-manager/delete/2">Delete</a></div><div class="editing"><a class="save" href="#save2">Save</a><a class="cancel" href="#cancel2">Cancel</a></div>')
          }
        },
        done: function(data){
          
        },
        error:function(error){
          console.log(error)
        }
      })
      e.preventDefault();
    })
    .on("click", ".editcontrols a.deleteitem", function(e){
      if(confirm("Are you sure you want to delete this?\n\n Clicking OK will remove the template from the system, and reset all content to use the default template. This will not delete the template files from the server.\n\nThis cannot be undone.")){
        console.log("yep")
        var row = $(this).parents("tr");
        var id = $.trim(row.find(".id span").text());
        var slug =  $.trim(row.find('.slug span').text());
        $.ajax({ 
          type: "POST",
          url: '/admin/ajax/template-manager/delete',
          dataType: "json",
          data: {
            id: id,
            slug: slug, 
          },
          cache: false,
          success: function(data){
            console.log(data)
            row.fadeOut();
          },
          done: function(data){
            
          },
          error:function(error){
            console.log(error)
          }
        })
        
      }
      e.preventDefault()
    });


    /* $("form#update_prizes").on("submit", this, function(e){
      $.ajax({ 
        type: "POST",
        url: '/admin/ajax/committedcooks-prizes',
        dataType: "json",
        data: $("form#update_prizes").serialize(),
        cache: false,
        success: function(data){
          console.log("ok")
        }
      });
      e.preventDefault()
    }) */

});