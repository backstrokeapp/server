import $ from 'jquery';

// enable the continue button when a user and repo have been entered
$("#user, #repo").on('keyup', function() {
  var user = $("#user").val();
  var repo = $("#repo").val();
  if (user.length && repo.length) {
    $("#next").prop('disabled', false);
  } else {
    $("#next").prop('disabled', true);
  }
});

// show the instructions panel
$("#next").on('click', function() {
  var user = $("#user").val();
  var repo = $("#repo").val();
  $(".user").html(user);
  $(".repo").html(repo);

  $(".new-webhook").attr("href", "https://github.com/"+user+"/"+repo+"/settings/hooks/new");
  $(".rest").animate({opacity: 1}, 200);
});
