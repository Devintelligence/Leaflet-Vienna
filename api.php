<?php


curl -vvv -H "fiware-service: temperature" -h "x-pvp-roles: fiware(temperature=ql:r+cb:w)" moft.apinf.io:8080/contextbroker/v2/



    echo curl("http://www.wienerlinien.at/ogd_realtime/monitor?rbl=147&activateTrafficInfo=stoerunglang&activateTrafficInfo=stoerunglang&activateTrafficInfo=aufzugsinfo&sender=1223434");

exit();


    function curl($url, $post='') {


        //cURL options
        $options = array(

            CURLOPT_CUSTOMREQUEST  => "GET",
            CURLOPT_POSTFIELDS     => $post,
            CURLOPT_HTTPHEADER     => array(
                                          'Content-Type: application/json',
                                          'Content-Length: ' . strlen($post)
                                      ),
									  
            CURLOPT_RETURNTRANSFER => true,     // return web page
            CURLOPT_HEADER         => false,    // don't return headers
            CURLOPT_FOLLOWLOCATION => true,     // follow redirects
            CURLOPT_ENCODING       => "",       // handle all encodings
            CURLOPT_AUTOREFERER    => true,     // set referer on redirect
            CURLOPT_CONNECTTIMEOUT => 500,      // timeout on connect
            CURLOPT_TIMEOUT        => 500,      // timeout on response
            CURLOPT_MAXREDIRS      => 10,       // stop after 10 redirects
            CURLOPT_SSL_VERIFYHOST => 0,
            CURLOPT_SSL_VERIFYPEER => 0


        );

        //Go go go!
        $ch      = curl_init( $url );
        curl_setopt_array( $ch, $options );

        $output = curl_exec( $ch );
        //$output['err']     = curl_errno( $ch );
        //$output['errmsg']  = curl_error( $ch );
        //$output['header']  = curl_getinfo( $ch );

        curl_close( $ch );

        return $output;

    }

?>
