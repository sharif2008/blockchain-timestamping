$(document).ready(function () {
	$("#verifyButton").click(function () {
		let hash = $('#verifyHash').val();
		if (hash.length == 0) {
			alert('No file is selected');
			return;
		}
		$.ajax({
			url: '/api/certificate/' + hash, //$('#verifyUuid').val(),
			type: 'get',
			success: function (response) {
				if (response.status) {
					console.log((response.data[2] == hash) ? 'match' : 'Not match');
					$('.alert').removeClass('d-none');
					if (response.data[2].length > 0 && response.data[2] == hash) {
						let msg = 'Congratulations!! This document exists in the blockhain as ' + response.data[1];
						$('#verifyStatus').html(msg);
					} else {
						let msg = 'Sorry!!!  we could not verify the document from blockchain';
						$('#verifyStatus').html(msg);
					}
				} else {
					alert(response.msg);
				}
			},
		});
	});

	$("#signButton").click(function () {
		let data = {};
		data.hash = $('#uploadHash').val();
		data.docId = $('#uploadUuid').val();
		if (data.hash.length == 0) {
			alert('No file is selected');
			return;
		}
		$.ajax({
			url: '/api/certificate/new',
			type: 'post',
			data: data,
			success: function (response) {
				if (response.status) {
					alert(response.msg);
					$('#txUuid').html(response.data.uuid);
					$('#txHash').html(response.data.tx);
					let link = "https://ropsten.etherscan.io/tx/" + response.data.tx;
					link = '<a  href = "' + link + '" target = "_blank" > ' + link + ' </a > ';
					//link += '(Click the link to check mining status)';
					$('#txLink').html(link);
				} else {
					alert(response.msg);
				}
			},
		});
	});

	$(".document").change(function () {
		let documentSelector = $(this);
		var fd = new FormData();
		var files = documentSelector[0].files; // Check file selected or not 
		if (files.length > 0) {
			fd.append('document', files[0]);
			$.ajax({
				url: '/file/upload',
				type: 'post',
				data: fd,
				contentType: false,
				processData: false,
				success: function (response) {
					if (response.status) {
						console.log(documentSelector.attr("class"));
						if (documentSelector.hasClass('upload')) {
							$('#uploadHash').val(response.hash);
							$('#uploadUuid').val(response.fileName);
						} else {
							$('#verifyHash').val(response.hash);
							$('#verifyStatus').html('');
						}
					} else {
						alert(response.msg);
					}
				},
			});
		} else {
			alert("Please select a file.");
		}
	});
});