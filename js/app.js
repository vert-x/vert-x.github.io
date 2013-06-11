(function ( $ ) {
    $.fn.highlight = function() {
        var self = this;
        self.addClass('highlight');
        setTimeout(function(){
            self.removeClass('highlight');
        }, 400);
        return self;
    };
}(jQuery));

$(document).ready(function(){
    
    // retreive vert.x stargazers count
    var githubAPI = 'https://api.github.com/repos/vert-x/vert.x';
    $.getJSON(githubAPI)
        .done(function(data){
            $('#stargazers').text(data.watchers_count);
        })
        .fail(function(){
            $('#stargazers').text('+2k');
        });


    // handle active states on the home page blocks
    $('.blocks').on('click', '.block', function(){
        $this = $(this);
        $this.children('.plus-sign').toggleClass('active').next().toggleClass('active');
    });


    // toggle languages blocks on the home page
    var $languagesTogglers = $('#languagesToggler').find('a');
    var $languagesBlocks = $('.code-block');
    $languagesTogglers.on('click', function(){
        var $this = $(this);
        var togglerId = $this.data('toggle');
        var togglerFileName = $this.text();
        
        // show correct block with correct tab
        $languagesTogglers.removeClass('active');
        $this.addClass('active');
        $languagesBlocks.removeClass('active');
        $('#'+togglerId).addClass('active');
        
        // modify #codeCmd text and highlight the <code> for a second
        $('#codeCmd1, #codeCmd2').text(togglerFileName).parent().highlight();
        
        return false;
    });

});
