resource "aws_vpc" "vpc-main" {
  cidr_block       = var.vpc_cidr
  tags = {
    Name = "main"
  }
}

resource "aws_subnet" "pub_sub1" {
  vpc_id     = aws_vpc.vpc-main.id
  cidr_block = var.public-cidr1
  availability_zone = var.availablityzone1
  map_public_ip_on_launch = true

  tags = {
    Name = "Main"
  }
}

resource "aws_subnet" "pub_sub2" {
  vpc_id     = aws_vpc.vpc-main.id
  cidr_block = var.public-cidr2
  availability_zone = var.availablityzone2
  map_public_ip_on_launch = true

  tags = {
    Name = "Main"
  }
}

# route table 
resource "aws_route_table" "pub-rt" {
  vpc_id = aws_vpc.vpc-main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "example"
  }
}

resource "aws_route_table_association" "pub-rta" {
  subnet_id      = aws_subnet.pub_sub1.id 
  route_table_id = aws_route_table.pub-rt.id
}

resource "aws_route_table_association" "pub-rta2" {
  subnet_id      = aws_subnet.pub_sub2.id 
  route_table_id = aws_route_table.pub-rt.id
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.vpc-main.id

  tags = {
    Name = "main"
  }
}

# sg group
resource "aws_security_group" "eks-sg" {
  name        = "eks-sg"
  description = "Allow TLS inbound traffic and all outbound traffic"
  vpc_id      = aws_vpc.vpc-main.id

 # Inbound Rules
  ingress {
    description = "Allow HTTP traffic"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Allow HTTPS traffic"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Allow SSH traffic"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Outbound Rules
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "allow_tls"
  }
}

# EKS CLUSTER

resource "aws_eks_cluster" "eks" {
  name = "node-cluster"
  role_arn = aws_iam_role.cluster.arn

  vpc_config {
    subnet_ids = [
      aws_subnet.pub_sub1.id,
      aws_subnet.pub_sub2.id
    ]
  }

  # Ensure that IAM Role permissions are created before and deleted
  # after EKS Cluster handling. Otherwise, EKS will not be able to
  # properly delete EKS managed EC2 infrastructure such as Security Groups.
  depends_on = [
    aws_iam_role_policy_attachment.cluster_AmazonEKSClusterPolicy,
  ]
}

resource "aws_iam_role" "cluster" {
  name = "eks-cluster-example"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "sts:AssumeRole",
          "sts:TagSession"
        ]
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "cluster_AmazonEKSClusterPolicy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.cluster.name
}

# node group
resource "aws_eks_node_group" "nodegroup" {
  cluster_name    = aws_eks_cluster.eks.name
  node_group_name = "example_node"
  capacity_type = "ON_DEMAND"
  instance_types = ["t3.medium"]
  node_role_arn   = aws_iam_role.example.arn
  subnet_ids      = [
    aws_subnet.pub_sub1.id,
    aws_subnet.pub_sub2.id
  ]

  scaling_config {
    desired_size = 1
    max_size     = 2
    min_size     = 1
  }

  update_config {
    max_unavailable = 1
  }


}

resource "aws_iam_role" "example" {
  name = "eks-node-group-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Service = "ec2.amazonaws.com"
        }

        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "example-AmazonEKSWorkerNodePolicy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.example.name
}

resource "aws_iam_role_policy_attachment" "example-AmazonEKS_CNI_Policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.example.name
}

resource "aws_iam_role_policy_attachment" "example-AmazonEC2ContainerRegistryReadOnly" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.example.name
}


# ec2
resource "aws_instance" "infra_setup" {
  count = 2
  ami = var.ami
  instance_type = var.instance_type
  vpc_security_group_ids = [ aws_security_group.eks-sg.id ]
  subnet_id = [
    aws_subnet.pub_sub1.id,
    aws_subnet.pub_sub2.id
  ][count.index]
  key_name = var.key_name
  root_block_device {
    volume_size = 25
    volume_type = "gp3"
    encrypted = true
  }
   tags = {
    Name = "infra-${count.index + 1}"
  }
}

