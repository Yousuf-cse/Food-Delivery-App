import mongoose, {Schema} from "mongoose";

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const userSchema = new Schema({
    username: {
        type: String,
        required: [true, "Username is required"],
        lowercase: true,
        minlength: 3,
        maxlength: 20,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        match: [emailRegex, "{VALUE} is not a valid email address!"],
        lowercase: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: 6,
        trim: true
    },
    avatar: {
        type: String,
        default: ""
    },
},{timestamps:true});
export const User = mongoose.model("User", userSchema);
