const express=require('express');
const app=express();
const env=require('dotenv');
env.config();
app.use(express.urlencoded({extended:true}));
app.use(express.json());
const PORT=process.env.PORT||5896


const {google} =require('googleapis')
const {oauth2} =require('googleapis/build/src/apis/oauth2')

const googleConfig={
    clientId:process.env.CLIENT_ID,
    clientSecret:process.env.CLIENT_SECRET,
    redirectUrl:'http://localhost:5896/redirect'
}
function createConnection() {
    return new google.auth.OAuth2(
      googleConfig.clientId,
      googleConfig.clientSecret,
      googleConfig.redirectUrl
    );
  }
const defaultScope = [
  'profile','email',
  'https://www.googleapis.com/auth/plus.me',
  'https://www.googleapis.com/auth/userinfo.email'

  ];
  function getConnectionUrl(auth) {
    return auth.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent', // access type and approval prompt will force a new refresh token to be made each time signs in
      scope: defaultScope
    });
  }
  function urlGoogle() {
    const auth = createConnection(); // this is from previous step
    const url = getConnectionUrl(auth);

    return url;
  }
  app.get('/getAuth',(req,res)=>{
      const url=urlGoogle();
      res.redirect(url)
  })

  app.get('/redirect',async (req,res)=>{
      const code =req.query.code
      console.log(code)
      const response=await getGoogleAccountFromCode(code)
      res.send(response)
  })

  async function getGoogleAccountFromCode(code) {
    const auth = createConnection();
  
    const data = await auth.getToken(code);
    const tokens = data.tokens;
    
    auth.setCredentials(tokens);
    const plus = getGooglePlusApi(auth);
    const me = await plus.people.get({ userId: 'me' });
    const userGoogleId = me.data.id;
    const userGoogleEmail = me.data.emails && me.data.emails.length && me.data.emails[0].value;
    return {
      id: userGoogleId,
      email: userGoogleEmail,
      tokens: tokens,
      me
    };
  }

  function getGooglePlusApi(auth) {
    return google.plus({ version: 'v1', auth });
  //  // return google.people({version:'v1',auth})
  //  return google.admin({version:'directory_v1',auth})
    
    
  }


app.listen(PORT,()=>{
    console.log('server started at port '+PORT)
})

