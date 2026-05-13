import { ApiProperty } from "@nestjs/swagger";
import { UserEntity } from '../../users/entities/user.entity';


export class LoginEntity  {
  @ApiProperty({ type: () => UserEntity })
  user: UserEntity;

  @ApiProperty()
  token: string;
}