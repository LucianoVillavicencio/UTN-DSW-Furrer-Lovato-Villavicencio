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

    @IsNumber()
    @IsNotEmpty()
    phone!: string;

    @IsNumber()
    @IsNotEmpty()
    password! : string;

    @IsBoolean()
    @IsNotEmpty()
    deleted! : boolean;

}

