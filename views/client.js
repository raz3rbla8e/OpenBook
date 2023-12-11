
function joinWorkshop(workshopId) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', `/main/work/${workshopId}/join`);

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {  // Check if the request is complete
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

function leaveWorkshop(workshopId) {
  var xhr = new XMLHttpRequest();
  xhr.open('DELETE', `/main/work/${workshopId}/leave`, true);
  xhr.setRequestHeader('Content-Type', 'application/json');

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {  // Check if the request is complete
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


