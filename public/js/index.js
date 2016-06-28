import $ from 'jquery';

// enable the continue button when a user and repo have been entered
$("#user, #repo").on('keydown', function() {
  let user = $("#user").val();
  let repo = $("#repo").val();
  if (user.length && repo.length) {
    $("#next").prop('disabled', false);
  } else {
    $("#next").prop('disabled', true);
  }
});
