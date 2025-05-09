import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import {ApiResponse} from "../utils/ApiResponse";
import { User } from "../models/User.model";
import jwt from "jsonwebtoken";

const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
      const user = await User.findById(userId)
      if (!user) throw new Error("user not find")

      console.log("generate access user",user);
       
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()

      console.log("generated acces token", accessToken);
      console.log("generated acces token", refreshToken);

      user.refreshToken = refreshToken
      await user.save({validateBeforeSave: false})
  
      return {accessToken, refreshToken};  

    } catch (error) {
      throw new ApiError(
        500,
        "Something went wrong while generating refresh and access token"
      )
    }
}

// register user
const registerUser = asyncHandler( async (req, res) => {
 
  const {username, email, password } = req.body
 
  if (
       [username, email, password].some((field) => field?.trim() === "")
  ) {
       throw new ApiError(400, "All fields are required")
  }
 
   const existedUser = await User.findOne({
     $or: [{ username }, {email }]
   })
 
   if (existedUser) {
     throw new ApiError(409, "This username or email already exists")
   }
   
   if (!avatar) {
     throw new ApiError("400", "Error!! upload avatar again")
   }
   
 
   // create user object - create entry in db
   const user= await User.create({
      username: username.toLowerCase(), 
      email,
      password,
   })
 
    // check that user sucessfully created in db or not & remove password and refresh token field from response
    const createdUser= await User.findById(user._id).select(
     "-password -refreshToken"
    )
 
    if (!createdUser) {
     throw new ApiError(500, "something went wrong while registering the user")
    }
 
    // return res
    return res.status(201).json(
     new ApiResponse(200, createdUser, "user registered successfully")
    )
   })

   //login controller
   const loginUser = asyncHandler(async(req,res) => {

    const {username, password} = req.body
    console.log(username);
    

    if (!(username)) {
      throw new ApiError(400, "username is required") 
    }

    // find the username in db
    const user = await User.findOne({ username });


     if (!user) {
      throw new ApiError(404, "user does not exist")
     }

     // password check
     const isPasswordValid = await user.isPasswordCorrect(password)

     if (!isPasswordValid) {
      throw new ApiError(401, "invalid user credentials")
     }

     // access and refresh token
     const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user._id)
    console.log(accessToken);
    console.log(refreshToken);
     
     

     const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

     // send cookie

     const options = {
        httpOnly: true,
        secure: true
     }

     return res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", refreshToken, options)
     .json(
      new ApiResponse(
          200,
          {
            user: loggedInUser, accessToken, refreshToken
          },
          "user loggedIn successfully"
     )
    )
})

// user logout 
const logoutUser = asyncHandler(async(req,res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1 // removes the file from document
      }
    },
    {
      new: true
    }
  )

  const options = {
    httpOnly: true,
    secure: true
 }

 return res
 .status(200)
 .clearCookie("accessToken", options)
 .clearCookie("refreshToken", options)
 .json(new ApiResponse(200, {}, "User logged out Successfully"))
})

// regenerate access token
const refreshAccessToken = asyncHandler( async( req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) {
   throw new ApiError(401, "unauthorized request")
  }

 try {
    const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id)

    if (!user) {
     throw new ApiError(401, "invalid refresh Token")
    }

    if (incomingRefreshToken !== user?.refreshToken) {
     throw new ApiError(401, "refreshtoken is expired or used")
    }

   const {accessToken, newRefreshToken} = await generateAccessTokenAndRefreshToken(user._id)

   const options = {
     httpOnly : true,
     secure: true
   }

   return res
   .status(200)
   .cookie("accessToken", accessToken, options)
   .cookie("refreshToken", newRefreshToken, options)
   .json(
     new ApiResponse(
       200,
       {accessToken, refreshToken: newRefreshToken},
       "access Token Refreshed"
     )
   )
 } catch (error) {
   throw new ApiError(401, error?.message || "invalid refresh token")
 }

})



export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
}
