import { IsBoolean, IsEmail, IsNotEmpty , IsNumber, IsString } from "class-validator";


export class UsersDto{

    @IsNumber()
    @IsNotEmpty()
    idUsuario!: number;

    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsNotEmpty()
    surname!: string;

    @IsString()
    @IsNotEmpty()
    phone!: string;

    @IsString()
    @IsNotEmpty()
    password! : string;

    @IsBoolean()
    @IsNotEmpty()
    deleted! : boolean;

}

