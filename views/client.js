// Function to join the workshop, sends a POST request to the server
function joinWorkshop(workshopId) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', `/main/work/${workshopId}/join`);

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status >= 200 && xhr.status < 300) {
        console.log('Successfully joined workshop');
        window.location.href = `/main/work/${workshopId}`;
        alert('Successfully joined workshop');
      } else {
        console.error('Failed to join workshop. Status:', xhr.status);
      }
    }
  };
  xhr.send();
}

// Function to leave workshop, sends a DELETE request to the server
function leaveWorkshop(workshopId) {
  var xhr = new XMLHttpRequest();
  xhr.open('DELETE', `/main/work/${workshopId}/leave`, true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status >= 200 && xhr.status < 300) {
        console.log('Successfully left workshop');
        window.location.href = `/main/work/${workshopId}`;
        alert('Successfully left workshop');
      } else {
        console.error('Failed to leave workshop. Status:', xhr.status);
      }
    }
  };

  xhr.send();
}
