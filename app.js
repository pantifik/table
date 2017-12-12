"use strict";

$(function() {
  
  $("#getData").submit(function(event){
    let val = $("#count").val();
    if (val != '' && (val.search(/^\d+$/) != -1)){
      const url = `http://www.filltext.com/?`;
      let param = {
        'rows': val,
        'id': '{number|1000}',
        'firstName': '{firstName}',
        'lastName': '{lastName}',
        'email': '{email}',
        'phone': '{phone|(xxx)xxx-xx-xx}',
        'adress': 'addressObject}',
        'description': '{lorem|32}',
        'delay': 3,
    
      };
      
      $.ajax({
        url: url,
        dataType: "json",
        data: param,
        beforeSend: function(){
          const load = $("<img/>", {
            'class': 'img-load',
            'src': './img/loading.svg'
          });
          $("#main").html(load);
        },
      }).done(function(data) {
        console.log(data);
        let app = new App(data);
  
        app.render();
      })
       .fail(function(xhr, textStatus, error){
         console.log(`${textStatus} ${error}`)
       });
  
      
      /*let param = `rows=${count}&id={number|1000}&firstName={firstName}&delay=3&lastName={lastName}&email={email}&phone={phone|(xxx)xxx-xx-xx}&adress={addressObject}&description={lorem|32}`;*/
  
      

      
    }else{
      $("#main").text('Введите число')
    }
   
    event.preventDefault();
  });
  
  
  class App{
    constructor(data){
      this.data = JSON.parse(JSON.stringify(data));
      this.amountLine = 30;
      this.count = 0;
      this.column = {
        favorite: 'favorite',
        id: 'id',
        firstName: 'firstName',
        lastName: 'lastName',
        email: 'email',
        phone: 'phone',
      };
      this.state = {
        data: this.data,
        countLength: 0,
        currentCount: 1,
        displayed: [],
        sortedCol: []
      };
    }
    
   get pagination(){
      this.state.countLength =  Math.ceil(this.state.data.length / this.amountLine);
      
      const self = this;
      const ulConfig= {
        'class': 'pagination',
        click: function(event){
          self.state.currentCount = +event.target.textContent;
          self.replaceBodyTable();
        }
      };
      let html = '';
  
      for (let i = 0; i < this.state.countLength; i++){
        html += `<li class="pagination__item">
                    <button class="pagination__btn">${i+1}</button>
                  </li>`;
      }
      return $("<ul/>", ulConfig).html(html);
    }
    replacePagination(){
      $("#pagination").html(this.pagination);
    }
    
    get table(){
      return this.state.table = $('<table/>').html([this.headerTable, this.bodyTable]);
    }
    
    get headerTable(){
      const self = this;
      let html = '';
  
      for(let key in this.column){
        html += `<th class="${key}" data-key="${key}">${this.column[key]?this.column[key]:''}</th>`
      }
      return $('<thead/>', {click: toggleClass }).html($("<tr/>").html(html));
      
      
      function toggleClass(e){
        if($(e.target).data('key') === 'favorite') return false;
        const $el = $(e.target);
        if ($el.hasClass('sort-up')){
          $el.toggleClass('sort-up sort-down')
        }else{
          $el.addClass('sort-up').removeClass('sort-down')
        }
        self.sort(e)
      }
    }
    
    get bodyTable(){
      const self = this;
      let body = [];
      let startPosition = (this.state.currentCount - 1) * this.amountLine;
      let endPosition = this.state.currentCount * this.amountLine;
      
      this.state.displayed = this.state.data.slice(startPosition, endPosition);
  
      $.each( this.state.displayed, function( i, item ) {
        let html = '';
    
        for(let key in self.column){
          let className = '';
          if (key === 'favorite' && item.className){
            className = item.className;
          }
          html += `<td class="${key} ${className}">${item[key]?item[key]:''}</td>`
        }
    
        body.push( $("<tr/>").html(html) );
      });
      
      this.state.body
            = $('<tbody/>', {
                  click: function(e){
                    self.getFull(e);
                    self.addFavorite(e);
                  }
                })
                .html(body);
      return this.state.body;
    }
  
    replaceBodyTable(){
      $(this.state.body).replaceWith(this.bodyTable);
    }
    
    getFull(e){
      const rowIndex = $(e.target).closest('tr').index();
      const res = this.state.displayed[rowIndex];
      
      const html =  `
                    Выбран пользователь: <b>${res.firstName || 'n/a'}</b><br>
                    Описание:<br>
                    <textarea>
                    ${res.description || 'n/a'}
                    </textarea><br>
                    Адрес проживания: <b>${res.adress.streetAddress || 'n/a'}</b><br>
                    Город: <b>${res.adress.city || 'n/a'}</b><br>
                    Провинция/штат: <b>${res.adress.state || 'n/a'}</b><br>
                    Индекс: <b>${res.adress.zip || 'n/a'}</b>
                  `;
      
      $("#fullInfo").html($("<p/>", {'class': 'fullInfo__content'}).html(html));
      return $("<p/>").html(html);
    }
    
    addFavorite(e){
      if (!$(e.target).hasClass('favorite')) return false;
      
      const $activeRow = $(e.target).closest('tr');
      const rowIndex = $activeRow.index();
      const dataIndex = rowIndex + (this.state.currentCount - 1) * this.amountLine;
      
      if (this.data[dataIndex].notLook){
        delete this.data[dataIndex].notLook;
        delete this.data[dataIndex].className;
      }else{
        this.data[dataIndex].notLook = true;
        this.data[dataIndex].className = 'added';
      }
      
  
      $activeRow.children('.favorite').toggleClass('added');
    }
  
    search(str){
      const searchColumn = Object.keys(this.column).join(' ');
      return this.state.data = this.data.filter(function (item) {
        
        let res;
        if (item.notLook){
          return true;
        }
        $.each(item, function (index, val) {
          if ( searchColumn.toLowerCase().indexOf(index.toLowerCase()) === -1 ) {
            return true; //continue
          }
          res = String(val).toLowerCase().indexOf(str);
          return (res === -1);
        });
        return  (res !== -1);
      })
    }
    
    sort(e){
      if($(e.target).data('key') == 'favorite') return false;
      if ($(this.state.sortedCol).data('key') !== $(e.target).data('key')){
        $(this.state.sortedCol).removeClass('sort-up sort-down')
      }
      this.state.sortedCol = e.target;
      const key = $(e.target).data('key');
      const direction = $(e.target).hasClass('sort-up');
      
      if(+this.state.data[0][key]){
        this.state.data.sort(numCompare);
      }else{
        this.state.data.sort(strCompare);
      }
      
      this.replaceBodyTable();
      
      
      function strCompare(firstItem, secondItem, course = direction, cell = key){
        if(course){
          if (firstItem[cell] < secondItem[cell]) return -1;
          if (firstItem[cell] > secondItem[cell]) return 1;
        }
          if (firstItem[cell] < secondItem[cell]) return 1;
          if (firstItem[cell] > secondItem[cell]) return -1;
        return 0;
      }
      
      function numCompare(firstItem, secondItem, course = direction, cell = key) {
        if (course)
          return firstItem[cell] - secondItem[cell];
        return secondItem[cell] - firstItem[cell];
      }
    }
    
    render(){
  
      const self = this;
      const config = {
        on: {
          input: function(event) {
            self.search(event.target.value.toLowerCase());
            self.replaceBodyTable();
            self.replacePagination();
          }
        }
      };
      
      $("#search").html( $('<input>', config) );
      $("#pagination").html( this.pagination );
      $("#main").html( this.table );
      
    }
  }
  
});