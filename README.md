https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=23RCXD&scope=activity+cardio_fitness+electrocardiogram+heartrate+location+nutrition+oxygen_saturation+profile+respiratory_rate+settings+sleep+social+temperature+weight&code_challenge=MAW4G5Jmci9QV7obCIdQshJMPKaD5jBaTQG07_TgNn4&code_challenge_method=S256&state=291q5l2z2m6l1b015l4j420d122o6o6h&redirect_uri=https%3A%2F%2Froybal.vercel.app%2Fauth%2Fcallback



they plan 3-5 walks per week, each planned walk they complete is 400 points and any additional unplanned walks are 250 each so the maximum they could get in a week is if they plan 5 walks and do an additional two unplanned is 2500
over the 12 weeks the total maximum is 30,000
and 1500 points =$1


now we have to figure out calculating planned activities. lets say participant number 1 plans to engage in an activity on wednesday. we need to check when we collect our data that the walk was actually engaged in. this will involve collaboration between all of our server side code and client side code. if two or more activities happen on the same day where one was planned, we do not count it as another planned walk. 