###################################################################
# Oreon is developped with GPL Licence 2.0 
#
# GPL License: http://www.gnu.org/licenses/gpl.txt
#
# Developped by : Julien Mathis - jmathis@merethis.com
#
###################################################################
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation; either version 2
# of the License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
#    For information : contact@merethis.com
####################################################################

sub checkAndUpdate($){
	my $data_service;
	if (($_[1] =~ "OSL_Module") || ($_[1] =~ "Meta_Module")){
		if ($_[5]){
			@data_service = identify_hidden_service($_[1], $_[2]); # return index_id and storage
			identify_hidden_metric($_[5], $data_service[0], $_[4], $_[0], $data_service[1]); # perfdata index status time type
		}
	} else {
		if ($_[5]){
			@data_service = identify_service($_[1], $_[2]); # return index_id and storage
			identify_metric($_[5], $data_service[0], $_[4], $_[0], $data_service[1]); # perfdata index status time type
		}
	}
	undef(@data_service);
	undef(@param);
}

sub updateRrdDB($$$$$$$){ # Path metric_id value timestamp interval type
	my $ERR;
	my $interval = 4000;

	# call function to check if DB exist and else create it
	if (-e $_[0]."/".$_[1].".rrd"){
		$_[3] =~ s/\,/\./g;
		RRDs::update ($_[0].$_[1].".rrd" , "--template", "metric", $_[2].":".sprintf("%e", $_[3]));
		$ERR = RRDs::error;
		if ($ERR){writeLogFile("ERROR while updating $_[0]/$_[1].rrd : $ERR\n");}
	} else {
		if ($_[0] && $_[1] && $_[5]){
			my $begin = $_[4] - 200000;
			$interval = getServiceCheckInterval($_[1]);
			if (!defined($interval)){$interval = 3};
			$interval = $interval * 60;
			RRDs::create ($_[0].$_[1].".rrd", "-b ".$begin, "-s ".$interval, "DS:metric:GAUGE:".$interval.":U:U", "RRA:AVERAGE:0.5:1:".$_[5], "RRA:MIN:0.5:12:".$_[5], "RRA:MAX:0.5:12:".$_[5]);
			$ERR = RRDs::error;
			if ($ERR){writeLogFile("ERROR while creating $_[0]$_[1].rrd : $ERR\n");}	
			$_[3] =~ s/\,/\./g;
			RRDs::update ($_[0].$_[1].".rrd" , "--template", "metric", $_[2].":".sprintf("%e", $_[3]));
			$ERR = RRDs::error;
			if ($ERR){writeLogFile("ERROR while updating $_[0]/$_[1].rrd : $ERR\n");}	
			undef($begin);
		}
	}
	undef($interval);
	undef($ERR);
}

# Add new bin data in Mysql DataBase

sub updateMysqlDB($$$$){ # connexion value timestamp
	my $sth1 = $con_ods->prepare("INSERT INTO `data_bin` (`id_metric`, `ctime`, `value`, `status`) VALUES ('".$_[0]."', '".$_[1]."', '".$_[2]."', '".$_[3]."')");
	if (!$sth1->execute) {writeLogFile("Error:" . $sth1->errstr . "\n");}
	undef($sth1);
}


sub updateRrdDBforHiddenSVC($$$$$$$){ # Path metric_id value timestamp interval type
	my $ERR;
	my $interval = 4000;

	# call function to check if DB exist and else create it
	if (-e $_[0]."/".$_[1].".rrd"){
		$_[3] =~ s/\,/\./g;
		RRDs::update ($_[0]."/".$_[1].".rrd" , "--template", "metric", $_[2].":".sprintf("%e", $_[3]));
		$ERR = RRDs::error;
		if ($ERR){writeLogFile("ERROR while updating $_[0]/$_[1].rrd : $ERR\n");}
	} else {
		if ($_[0] && $_[1] && $_[5]){
			my $begin = $_[4] - 200000;
			$interval = 120;
			RRDs::create ($_[0]."/".$_[1].".rrd", "-b ".$begin, "-s ".$interval, "DS:metric:GAUGE:".$interval.":U:U", "RRA:AVERAGE:0.5:1:".$_[5], "RRA:MIN:0.5:12:".$_[5], "RRA:MAX:0.5:12:".$_[5]);
			$ERR = RRDs::error;
			if ($ERR){writeLogFile("ERROR while creating $_[0]/$_[1].rrd : $ERR\n");}	
			$_[3] =~ s/\,/\./g;
			RRDs::update ($_[0]."/".$_[1].".rrd" , "--template", "metric", $_[2].":".sprintf("%e", $_[3]));
			$ERR = RRDs::error;
			if ($ERR){writeLogFile("ERROR while updating $_[0]/$_[1].rrd : $ERR\n");}	
			undef($begin);
		}
	}
	undef($interval);
	undef($ERR);
}

# Add new bin data in Mysql DataBase

sub updateMysqlDBforHiddenSVC($$$$){ # connexion value timestamp
	my $sth1 = $con_ods->prepare("INSERT INTO `data_bin` (`id_metric`, `ctime`, `value`, `status`) VALUES ('".$_[0]."', '".$_[1]."', '".$_[2]."', '".$_[3]."')");
	if (!$sth1->execute) {writeLogFile("Error:" . $sth1->errstr . "\n");}
	undef($sth1);
}

1;