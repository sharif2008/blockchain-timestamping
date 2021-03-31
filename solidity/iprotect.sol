pragma solidity >=0.4.0 <0.7.0;

contract DocTimestamp  {
    
    struct Certificate {
       	 string uuid;
		 string sha256;
		 string docId;
    }
    
    address payable creator;
    mapping(string => Certificate) certificates;
  

    constructor() public {
        creator = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender == creator,  "Only creator can call this function.");
        _;
    }
    
    event NewCertificateIssue(string _uuid, string _docId, string _sha256 );
    
    
    function issueCertificate(string memory  _uuid, string memory _docId, string memory  _sha256) onlyOwner public {
        Certificate memory certificate= Certificate(_uuid, _docId,_sha256);
        certificates[_uuid]=certificate;
        
        emit NewCertificateIssue(_uuid,_docId,_sha256);
    }
    
    function getByUUID(string memory  _uuid) onlyOwner  view public returns(string memory, string memory, string memory )  {
        Certificate storage  out=certificates[_uuid];
        return (out.uuid, out.sha256, out.docId);
    }
}