connections: [
	{
		title: 'Basel SBB - Barfi - Allschwil',
		from: 'Basel, Bahnhof SBB',
		via: [
			'Basel, Barfüsserplatz',
		],
		to: 'Basel, Allschwilerplatz',
	},
	{
		title: 'Basel - Zürich',
		from: 'Basel SBB',
		to: 'Zürich HB'
	}
],

style: '#swissTransportData { position: relative; left: 570px; background-color: rgba(#fff, 0.5); padding: 0 5px 10px; border-radius: 5px; } #lastUpdate { margin-top: 20px; font-size: 85%; color: #333; } .loader { text-align: center; margin-top: -15px; margin-bottom: -15px; transition: all 0.4s ease 0s; } .content-container { transition: all 0.4s ease 0s; } table { margin-bottom: 5px; } .connections table:nth-of-type(2n+1) { background-color: rgba(#f9f9f9, 0.5); } .vehicle { width: 70px; } .time { width: 50px; } .station { width: 220px; } .to { width: 220px; }',

// 1min = 1000 * 60s
refreshFrequency: 1000 * 60,

/***********************************
 * Don't change anything below
 ***********************************/


command: '',

render: function() {
	var content = '<div id="swissTransportData"><h1>My favorite SBB connections</h1><div id="swissTransportDataContent">';

	$.each(this.connections, function(index, connection) {
		connection.identifier = 'connection-' + index;
		connection.fields = [
			'connections/sections'
		];

		content += '<h3>' + connection.title + '</h3><div id="loader-' + connection.identifier + '" class="loader"><img src="uebersicht-widget-for-swiss-transport-data.widget/loader.gif" width="220" height="20" /></div><div id="' + connection.identifier + '" class="content-container"></div>';
	});

	content += '<p id="lastUpdate"></p></div></div>';

	return content;
},

update: function(output, domEl) {
	var self = this;

	var lastUpdate = 'Last update: ' + (new Date).toLocaleTimeString() + ' (every ' + (self.refreshFrequency/1000) + 's)';
	$('#lastUpdate').html(lastUpdate);

	$('.loader').css('opacity', 1);
	$('.content-container').css('opacity', 0.5);

	$.each(this.connections, function(index, connection) {
		var ajaxObject = $.ajax({
			url: 'http://transport.opendata.ch/v1/connections',
			dataType: 'json',
			async: true,
			cache: false,
			data: connection,
			success: function(data) {
				var content = self.renderConnectionData(data, connection);

				$('#loader-' + connection.identifier).css('opacity', 0);
				$('#' + connection.identifier).html(content).css('opacity', 1);
			}
		});
	});
},

renderConnectionData: function(connectionResponse, connectionRequest) {
	var self = this,
		count = 0;

	content = '<div class="connections">';
	$.each(connectionResponse.connections, function(index, connection) {
		content += '<table><tbody>';

		$.each(connection.sections, function(index, section) {
			var vehicle = self.getVehicle(section.journey);

			if (vehicle) {
				// from
				content += '<tr>';
				content += '<td class="vehicle">' + vehicle + '</td>';
				content += '<td class="time">' + self.getTime(section.departure.departure) + '</td>';
				content += '<td class="station">' + section.departure.station.name + '</td>';
				content += '<td class="to">' + self.getJourneyTime(section.departure.departureTimestamp, section.arrival.arrivalTimestamp) + '\' (-> ' + section.journey.to + ')</td>';
				content += '</tr>';

				// to
				content += '<tr>';
				content += '<td></td>';
				content += '<td>' + self.getTime(section.arrival.arrival) + '</td>';
				content += '<td>' + section.arrival.station.name + '</td>';
				content += '<td></td>';
				content += '</tr>';
			}
		});

		content += '</tbody></table>';

		count++;
	});

	content += '</div>';

	return content;
},

getVehicle: function(journeyData) {
	var content = '';

	if (journeyData) {
		// cleanup
		content = journeyData.name.replace(journeyData.number, '').trim();

		// readable labels
		content = content.replace('NFT', 'T');
		content = content.replace('NFB', 'Bus');
	}

	return content;
},

getTime: function(date) {
	return date.replace(/.*T([0-9]{2}:[0-9]{2}).*/, '$1');
},

getJourneyTime: function(departureTimestamp, arrivalTimestamp) {
	return (arrivalTimestamp - departureTimestamp) / 60;
}